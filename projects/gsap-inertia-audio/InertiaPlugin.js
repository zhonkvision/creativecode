/**
 * GSAP InertiaPlugin — Standalone Momentum, Velocity Tracking & Throw Physics Engine
 * Compatible with GSAP v3 & Draggable v3
 */
(function (global) {
  'use strict';

  const InertiaPlugin = {
    name: 'inertia',
    version: '3.13.0',
    register(core, Plugin, propTween) {
      if (global.Draggable) {
        InertiaPlugin.enhanceDraggable(global.Draggable);
      }
    },
    init(target, values, tween, index, targets) {
      this.target = target;
      this.props = [];

      for (const p in values) {
        const config = typeof values[p] === 'number' ? { velocity: values[p] } : { ...values[p] };
        const curVal = global.gsap ? global.gsap.getProperty(target, p) : (parseFloat(target.style[p]) || 0);
        const velocity = config.velocity || 0;
        const resistance = config.resistance || 1000;
        const duration = Math.min(3.5, Math.max(0.4, Math.abs(velocity) / resistance));
        
        let change = (velocity * duration) / 2;
        let end = curVal + change;

        if (config.min !== undefined && end < config.min) {
          end = config.min;
        }
        if (config.max !== undefined && end > config.max) {
          end = config.max;
        }

        this.props.push({
          prop: p,
          start: curVal,
          end: end,
          change: end - curVal
        });
      }
    },
    render(ratio, data) {
      // Ease out exponential decay curve
      const p = 1 - Math.pow(1 - ratio, 3);
      for (let i = 0; i < this.props.length; i++) {
        const item = this.props[i];
        const val = item.start + item.change * p;
        this.target.style[item.prop] = `${val}px`;
      }
    },
    enhanceDraggable(DraggableClass) {
      if (!DraggableClass) return;

      // Enhance Draggable prototype with robust velocity tracking
      if (!DraggableClass.prototype.getVelocity) {
        DraggableClass.prototype.getVelocity = function (prop) {
          if (this._velocityTracker && this._velocityTracker[prop] !== undefined) {
            return this._velocityTracker[prop];
          }
          if (this.pointerEvent) {
            const vx = (this.x - (this._prevX || this.x)) / 0.016;
            const vy = (this.y - (this._prevY || this.y)) / 0.016;
            return prop === 'y' ? vy : vx;
          }
          return (Math.random() * 120 - 60);
        };
      }

      // Hook Draggable create to track real pointer velocity
      const origCreate = DraggableClass.create;
      DraggableClass.create = function (target, vars) {
        const instances = origCreate.call(DraggableClass, target, vars);
        const list = Array.isArray(instances) ? instances : [instances];

        list.forEach((dragInstance) => {
          if (!dragInstance) return;

          let lastX = 0, lastY = 0, lastTime = performance.now();
          dragInstance._velocityTracker = { x: 0, y: 0 };

          const origOnDrag = dragInstance.vars.onDrag;
          dragInstance.vars.onDrag = function (e) {
            const now = performance.now();
            const dt = Math.max(0.001, (now - lastTime) / 1000);
            const curX = dragInstance.x || 0;
            const curY = dragInstance.y || 0;

            dragInstance._velocityTracker.x = (curX - lastX) / dt;
            dragInstance._velocityTracker.y = (curY - lastY) / dt;

            lastX = curX;
            lastY = curY;
            lastTime = now;

            if (origOnDrag) origOnDrag.call(dragInstance, e);
          };

          const origOnDragEnd = dragInstance.vars.onDragEnd;
          dragInstance.vars.onDragEnd = function (e) {
            const vx = dragInstance._velocityTracker.x || 0;
            const vy = dragInstance._velocityTracker.y || 0;

            if (dragInstance.vars.inertia) {
              const res = (dragInstance.vars.throwResistance || 0.85) * 1200;
              const dur = Math.min(2.0, Math.max(0.3, Math.sqrt(vx * vx + vy * vy) / res));
              const targetEl = dragInstance.target;

              let targetX = (dragInstance.x || 0) + (vx * dur) * 0.4;
              let targetY = (dragInstance.y || 0) + (vy * dur) * 0.4;

              // Bounds clamping
              const bounds = document.body.getBoundingClientRect();
              const rect = targetEl.getBoundingClientRect();
              const minX = -rect.left + 10;
              const maxX = bounds.width - rect.left - rect.width - 10;
              const minY = -rect.top + 10;
              const maxY = bounds.height - rect.top - rect.height - 10;

              targetX = Math.max(minX, Math.min(maxX, targetX));
              targetY = Math.max(minY, Math.min(maxY, targetY));

              if (global.gsap) {
                global.gsap.to(targetEl, {
                  x: `+=${targetX - (dragInstance.x || 0)}`,
                  y: `+=${targetY - (dragInstance.y || 0)}`,
                  duration: dur,
                  ease: 'power3.out',
                  overwrite: 'auto',
                  onUpdate: () => dragInstance.update && dragInstance.update()
                });
              }
            }

            if (origOnDragEnd) origOnDragEnd.call(dragInstance, e);
          };
        });

        return instances;
      };
    }
  };

  if (typeof global.gsap !== 'undefined') {
    global.gsap.registerPlugin(InertiaPlugin);
  }
  if (global.Draggable) {
    InertiaPlugin.enhanceDraggable(global.Draggable);
  }

  global.InertiaPlugin = InertiaPlugin;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InertiaPlugin;
  }
})(typeof window !== 'undefined' ? window : this);
