import { VERT, FRAG, MASTER_FRAG, SHADER_REV } from './shader'
import { inkById, paperHex, paperProfile } from '../inks'
import { MAX_LAYERS, type InkLayer, type StudioState } from '../types'

export { SHADER_REV }

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

/** The drums that actually reach the paper, in print order. */
export function pressLayers(state: StudioState): InkLayer[] {
  return state.layers.filter((l) => l.enabled).slice(0, MAX_LAYERS)
}

const DEG = Math.PI / 180

export class RisoRenderer {
  private gl: WebGL2RenderingContext
  private prog: WebGLProgram
  private masterProg: WebGLProgram
  private tex: WebGLTexture | null = null
  private shaderRev = SHADER_REV
  imgW = 0
  imgH = 0
  canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false })
    if (!gl) throw new Error('WebGL2 not supported')
    this.gl = gl
    this.prog = this.link(FRAG)
    this.masterProg = this.link(MASTER_FRAG)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  }

  private compile(type: number, src: string) {
    const gl = this.gl
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed')
    }
    return s
  }

  private link(fragSrc: string) {
    const gl = this.gl
    const p = gl.createProgram()!
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, fragSrc))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) ?? 'link failed')
    }
    return p
  }

  /** Recompile programs after HMR brings new shader source. */
  syncShaders() {
    if (this.shaderRev === SHADER_REV) return
    const gl = this.gl
    gl.deleteProgram(this.prog)
    gl.deleteProgram(this.masterProg)
    this.prog = this.link(FRAG)
    this.masterProg = this.link(MASTER_FRAG)
    this.shaderRev = SHADER_REV
  }

  setImage(source: TexImageSource & { width: number; height: number }) {
    const gl = this.gl
    if (this.tex) gl.deleteTexture(this.tex)
    this.tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.imgW = source.width
    this.imgH = source.height
  }

  /** Feed the whole press state to a program. `only` isolates one drum. */
  private bind(prog: WebGLProgram, state: StudioState, only: number) {
    const gl = this.gl
    gl.useProgram(prog)
    const u = (n: string) => gl.getUniformLocation(prog, n)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.uniform1i(u('u_img'), 0)
    gl.uniform2f(u('u_imgRes'), this.imgW, this.imgH)

    const layers = pressLayers(state)
    gl.uniform1i(u('u_count'), layers.length)
    gl.uniform1i(u('u_only'), only)
    const paper = paperProfile(state)
    gl.uniform3fv(u('u_paper'), hexToRgb(paperHex(state)))
    gl.uniform1f(u('u_paperTex'), state.paperTex)
    gl.uniform4f(u('u_paperMat'), paper.fiberScale, paper.fiberAniso, paper.fleck, paper.warmth)
    gl.uniform1f(u('u_paperTooth'), paper.tooth)
    gl.uniform1f(u('u_paperCalender'), paper.calender)
    gl.uniform1f(u('u_bleed'), state.bleed ?? 0)
    gl.uniform1f(u('u_roller'), state.roller ?? 0)
    gl.uniform1f(u('u_grain'), state.grain ?? 0)
    const wearLoc = u('u_wear')
    if (wearLoc) gl.uniform1f(wearLoc, state.wear ?? 0)
    gl.uniform1f(u('u_bright'), state.bright)
    gl.uniform1f(u('u_contrast'), state.contrast)
    gl.uniform1f(u('u_sat'), state.sat)

    const inks: number[] = []
    const density: number[] = []
    const lcon: number[] = []
    const sep: number[] = []
    const tex: number[] = []
    const scale: number[] = []
    const angle: number[] = []
    const off: number[] = []
    const rot: number[] = []
    const seed: number[] = []
    for (let i = 0; i < MAX_LAYERS; i++) {
      const l = layers[i]
      if (l) {
        inks.push(...hexToRgb(inkById(l.inkId).hex))
        density.push(l.density)
        lcon.push(l.contrast)
        sep.push(l.sep)
        tex.push(l.tex)
        scale.push(l.scale)
        angle.push(l.angle * DEG)
        // Shifting the sample point moves the plate the opposite way, so negate
        // to keep +offX/+offY meaning "the plate lands right/down" on screen.
        off.push(-l.offX, l.offY)
        rot.push(l.rot * DEG)
        seed.push(l.seed)
      } else {
        inks.push(0, 0, 0)
        density.push(0); lcon.push(1); sep.push(0); tex.push(0)
        scale.push(4); angle.push(0); off.push(0, 0); rot.push(0); seed.push(0)
      }
    }
    gl.uniform3fv(u('u_ink[0]'), inks)
    gl.uniform1fv(u('u_density[0]'), density)
    gl.uniform1fv(u('u_lcon[0]'), lcon)
    gl.uniform1iv(u('u_sep[0]'), sep)
    gl.uniform1iv(u('u_tex[0]'), tex)
    gl.uniform1fv(u('u_scale[0]'), scale)
    gl.uniform1fv(u('u_angle[0]'), angle)
    gl.uniform2fv(u('u_off[0]'), off)
    gl.uniform1fv(u('u_rot[0]'), rot)
    gl.uniform1fv(u('u_seed[0]'), seed)
  }

  private resize(outW: number, outH: number) {
    if (this.canvas.width !== outW || this.canvas.height !== outH) {
      this.canvas.width = outW
      this.canvas.height = outH
    }
    this.gl.viewport(0, 0, outW, outH)
  }

  render(state: StudioState, outW: number, outH: number) {
    if (!this.tex) return
    this.syncShaders()
    this.resize(outW, outH)
    this.bind(this.prog, state, -1)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3)
  }

  /**
   * One drum on its own. 'master' is the continuous-tone black plate you burn
   * a stencil from; 'proof' is that pass alone on the paper, screen and all.
   */
  renderSeparation(
    state: StudioState,
    layerIndex: number,
    mode: 'master' | 'proof',
    outW: number,
    outH: number,
  ) {
    if (!this.tex) return
    this.syncShaders()
    this.resize(outW, outH)
    this.bind(mode === 'master' ? this.masterProg : this.prog, state, layerIndex)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3)
  }
}
