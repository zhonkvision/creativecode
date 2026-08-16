/**
 * CreativeCode.my — Cyberpunk Preloader, ANSI/ASCII Shaded "CREATIVE CODE" Typography & Laboratory Boot Sequence
 */
import { audioEngine } from '../engine/audio.js';

export class Preloader {
  /**
   * @param {HTMLElement} mountEl
   * @param {Function} onEnter
   */
  constructor(mountEl, onEnter) {
    this.mountEl = mountEl;
    this.onEnter = onEnter;
    this.container = null;
    this.progress = 0;
    this.isLoaded = false;
    this.diagInterval = null;
    this.glitchInterval = null;
    this.render();
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'preloader-overlay';
    this.container.id = 'systemPreloader';

    // Rich ANSI Block-Shaded ASCII Typography for "CREATIVE CODE" (Both Words Centered)
    const asciiHtml = `<span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄  </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄</span><span style="color:#AAAAAA">▄  </span><span style="color:#FFFFFF">▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄</span>
<span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">         </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">           </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">         </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">            </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">            </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">    </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">         </span><span style="color:#555555">█</span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">        </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">    </span><span style="color:#555555">▄▄▄</span><span style="color:#AAAAAA">▄   </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">        </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">    </span><span style="color:#555555">█▀▀</span><span style="color:#FFFFFF;background-color:#AAAAAA">▄</span><span style="color:#AAAAAA">    </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">        </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">    </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">        </span><span style="color:#555555">█</span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█▀▀▀▀▀▀</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA"> </span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█▀▀▀▀▀▀</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">   </span><span style="color:#AA0000">░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> ▀</span><span style="color:#555555">▀▀▀</span><span style="color:#FFFFFF;background-color:#AAAAAA">▄</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█▀▀▀▀</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█▀▀▀▀▀▀</span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#AAAAAA"> ▀</span><span style="color:#FFFFFF">▀▀▀</span><span style="color:#AAAAAA">   </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░▒</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄▄▄</span><span style="color:#AAAAAA">▄  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░░</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄█</span><span style="color:#AAAAAA"> </span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░▒</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄▄▄</span><span style="color:#AAAAAA">▄ </span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░░░</span><span style="color:#AAAAAA">      </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒▒▒▒░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒░░░░░░░▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒▒▒▒░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░▒</span><span style="color:#555555">█▀</span><span style="color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">▀</span><span style="color:#AAAAAA">▄  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒▒▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒░▒▒▒▒▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒▒▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒░</span><span style="color:#AAAAAA"> </span><span style="color:#555555;background-color:#AAAAAA">▄</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▒</span><span style="color:#555555">█▀▀▀▀▀</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓▒▒▒▒▓▓▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▒</span><span style="color:#555555">█▀▀▀▀▀</span><span style="color:#AAAAAA"> </span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▒▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▓▓░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓█</span><span style="color:#555555">█▀▀</span><span style="color:#FFFFFF;background-color:#AAAAAA">▄</span><span style="color:#AA0000">█▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓█</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">      </span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓██</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓█▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓██</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓██</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">█▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓██</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555;background-color:#AA0000">▀</span><span style="color:#FFFFFF">▄▄</span><span style="color:#FFFFFF;background-color:#AAAAAA">▀</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓██</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄▄▄▄</span><span style="color:#AAAAAA">▄</span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#FFFFFF;background-color:#AA0000">   </span><span style="color:#AA0000">▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">███▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span>
<span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#FFFFFF;background-color:#AA0000">    </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA">     </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">▀</span><span style="color:#AAAAAA;background-color:#AA0000">▄</span><span style="color:#AA0000">██████</span><span style="color:#555555;background-color:#AA0000">▄</span><span style="color:#555555">▀</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span>

               <span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">    </span><span style="color:#FFFFFF">▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">▄▄▄▄▄▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span>
               <span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">         </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">          </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">        ▀▄  </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">    </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">          </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">         </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">        </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">          </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">          </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">    </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AAAAAA">          </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">        </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█▀▀▀▀▀▀</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█▀▀</span><span style="color:#FFFFFF;background-color:#AAAAAA">▄</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█▀</span><span style="color:#AAAAAA">▄ </span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█▀▀</span><span style="color:#FFFFFF;background-color:#AAAAAA">▄</span><span style="color:#AA0000">░</span><span style="color:#AAAAAA">  </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█▀▀▀▀▀▀</span><span style="color:#AAAAAA"> </span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF;background-color:#AAAAAA">█</span><span style="color:#AA0000">░░</span><span style="color:#AAAAAA"> </span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░░░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒▒</span><span style="color:#555555">█</span><span style="color:#FFFFFF">█▀▀▀▀▀</span><span style="color:#555555;background-color:#AAAAAA">▄</span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒░</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▒▒▒</span><span style="color:#555555">█</span><span style="color:#FFFFFF;background-color:#AAAAAA">▀</span><span style="color:#555555">▄</span><span style="color:#AAAAAA">▄  </span><span style="color:#AA0000">░</span><span style="color:#555555">█</span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▒▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▒</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">░▒▒</span><span style="color:#555555">█</span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">       </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓█</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓▓</span><span style="color:#555555">█</span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓██</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄▄▄▄</span><span style="color:#AAAAAA">▄ </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄█</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄</span><span style="color:#FFFFFF;background-color:#AA0000">▀</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓▓██</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">█▓▓</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">▓██</span><span style="color:#555555;background-color:#AAAAAA">▀</span><span style="color:#FFFFFF">▄▄█</span><span style="color:#AA0000">███</span><span style="color:#555555">█</span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">███</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">███</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██████████</span><span style="color:#555555">█</span>
               <span style="color:#FFFFFF">█</span><span style="color:#AA0000">█████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██████████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████████</span><span style="color:#555555;background-color:#AA0000">▄</span><span style="color:#555555">▀</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">████</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">███</span><span style="color:#555555">█</span><span style="color:#AAAAAA">  </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">███</span><span style="color:#555555">█</span><span style="color:#AAAAAA"> </span><span style="color:#FFFFFF">█</span><span style="color:#AA0000">██████████</span><span style="color:#555555">█</span>`;

    this.container.innerHTML = `
      <div class="preloader-scanline-mesh"></div>
      
      <div class="preloader-terminal-box">
        <div class="preloader-header-tag">
          <span>SYSTEM INIT // EXPERIMENTAL PLAYGROUND</span>
          <span style="color: var(--phosphor-amber);">SYS_BUILD: 2026.08</span>
        </div>

        <!-- Shaded ANSI Block ASCII Typography for "CREATIVE CODE" (Centered) -->
        <div class="ascii-ambigram-wrapper">
          <pre class="ascii-ambigram-art" id="preloaderAscii">${asciiHtml}</pre>
        </div>

        <div class="preloader-statement">
          A LIVING TASTE ENGINE & EXPERIMENTAL GENERATIVE LABORATORY FOR CREATIVE CODING
        </div>

        <div class="preloader-desktop-notice">
          <span class="desktop-notice-pill">
            <span class="notice-beacon"></span>
            <span>BEST VIEWED ON DESKTOP FOR FULL EXPERIENCE</span>
          </span>
        </div>

        <!-- Cyberpunk Loading Progress Bar -->
        <div class="preloader-bar-section" id="preloaderBarSection">
          <div class="preloader-bar-track">
            <div class="preloader-bar-fill" id="preloaderFill"></div>
          </div>
          <div class="preloader-bar-meta">
            <span id="preloaderDiagText">ALLOCATING GL SHADERS & RUNTIMES...</span>
            <strong id="preloaderPercent">00%</strong>
          </div>
        </div>

        <!-- Clean Minimalist Enter Button -->
        <div class="preloader-enter-section" id="preloaderEnterSection" style="display: none;">
          <button class="preloader-enter-btn" id="btnEnterLab" aria-label="Enter Laboratory">
            <span class="btn-indicator-dot"></span>
            <span class="btn-text">ENTER LABORATORY</span>
            <span class="btn-arrow">&rarr;</span>
          </button>
          <div class="enter-subtext">PRESS SPACE OR CLICK TO ENTER</div>
        </div>

        <!-- Diagnostic Stream -->
        <div class="preloader-diag-stream" id="preloaderStream">
          <div>[KERNEL] Visual DNA Core mounting...</div>
        </div>
      </div>
    `;

    this.mountEl.appendChild(this.container);
    this.startLoading();
    this.startAsciiFlicker();
  }

  startAsciiFlicker() {
    const asciiEl = this.container.querySelector('#preloaderAscii');
    if (!asciiEl) return;

    this.glitchInterval = setInterval(() => {
      if (Math.random() > 0.82) {
        asciiEl.classList.add('ascii-glitch');
        setTimeout(() => asciiEl.classList.remove('ascii-glitch'), 120);
      }
    }, 400);
  }

  startLoading() {
    const fill = this.container.querySelector('#preloaderFill');
    const percent = this.container.querySelector('#preloaderPercent');
    const diagText = this.container.querySelector('#preloaderDiagText');
    const stream = this.container.querySelector('#preloaderStream');

    const steps = [
      { at: 15, text: 'DECODING VISUAL DNA MANIFEST & TOKENS...', log: '[DNA] Manifest loaded: 4 channels, 30 specimens.' },
      { at: 35, text: 'COMPILING WEBGL2 & PROCEDURAL SHADER GRIDS...', log: '[GL] Fragment pipelines linked: Riso, Wafer, Vector 3D.' },
      { at: 65, text: 'MOUNTING GPU MANAGERS & DPR CLAMPING...', log: '[GPU] IntersectionObserver throttling active.' },
      { at: 85, text: 'CALIBRATING MUSIC FOR PROGRAMMING STREAM...', log: '[AUDIO] Music for Programming stream primed.' },
      { at: 100, text: 'SYSTEM FULLY OPERATIONAL. READY TO LAUNCH.', log: '[SYSTEM] Experimental laboratory unlocked.' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      this.progress += Math.floor(Math.random() * 6) + 4;
      if (this.progress > 100) this.progress = 100;

      if (fill) fill.style.width = `${this.progress}%`;
      if (percent) percent.innerText = `${String(this.progress).padStart(2, '0')}%`;

      if (currentStep < steps.length && this.progress >= steps[currentStep].at) {
        const s = steps[currentStep];
        if (diagText) diagText.innerText = s.text;
        if (stream) {
          const row = document.createElement('div');
          row.innerText = s.log;
          stream.appendChild(row);
          stream.scrollTop = stream.scrollHeight;
        }
        audioEngine.playSlider(this.progress / 100);
        currentStep++;
      }

      if (this.progress >= 100) {
        clearInterval(interval);
        this.onReady();
      }
    }, 55);
  }

  onReady() {
    this.isLoaded = true;
    const barSection = this.container.querySelector('#preloaderBarSection');
    const enterSection = this.container.querySelector('#preloaderEnterSection');
    const enterBtn = this.container.querySelector('#btnEnterLab');

    if (barSection) barSection.style.display = 'none';
    if (enterSection) enterSection.style.display = 'flex';

    audioEngine.playSelect();

    if (enterBtn) {
      enterBtn.addEventListener('mouseenter', () => {
        audioEngine.playHover();
      });

      const handleEnter = () => {
        audioEngine.playBoot();
        audioEngine.startAmbient();
        this.dismiss();
      };

      enterBtn.addEventListener('click', handleEnter);

      this.keyHandler = (e) => {
        if (this.isLoaded && (e.code === 'Space' || e.code === 'Enter') && !e.target.matches('input, textarea')) {
          e.preventDefault();
          handleEnter();
        }
      };
      window.addEventListener('keydown', this.keyHandler);
    }
  }

  dismiss() {
    if (this.glitchInterval) clearInterval(this.glitchInterval);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.container.classList.add('dismissing');

    setTimeout(() => {
      this.container.remove();
      if (this.onEnter) this.onEnter();
    }, 600);
  }
}
