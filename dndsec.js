class Slider {
    constructor({ sliderContainer: selector, currSlide = 0, animProps, duration, easing, touchControls }) {
        this._selector = selector;
        this.currSlide = currSlide;
        this.animProps = animProps; // Animation property functions
        this.animOpts = { duration, easing }; // Animation configuration
        this._touchControls = touchControls
        this.snapThreshold = 0.3
    }

    get sliderContainer() { return document.querySelector(this._selector) }
    // namespace the ND-section slides to avoid colliding with nav carousel
    get slideWrapper() { return this.sliderContainer.querySelector(".nd-slide-wrapper") }
    get slides() { return Array.from(this.slideWrapper ? this.slideWrapper.querySelectorAll(".nd-slide") : []) }

    get slideWidth() { return this.slides[0].offsetWidth }
    get wrapperWidth() { return this.slideWrapper.offsetWidth }

    init() {
        this.moveSlide(this.currSlide);
        if (this._touchControls) this.initTouchControls()
    }
    isWithinBounds(index) {
        return index >= 0 && index < this.slides.length;
    }


    moveSlide(targetSlide, animate = true) {
        if (!this.isWithinBounds(targetSlide)) return this.moveSlide(this.currSlide)
        this.slides.forEach((slide, index) => {
            const props = this.computeAnimProps(targetSlide, index, slide);
            if (animate) {
                const anim = slide.animate(props, this.animOpts);
                anim.finished.then(() => Object.assign(slide.style, props));
            } else {
                Object.assign(slide.style, props);
            }
        });
        this.currSlide = targetSlide;
    }


    computeAnimProps(targetSlide, slideIndex, slideElem, progress = 1) {
        const props = {};
        for (let key of Object.keys(this.animProps)) {
            props[key] = this.animProps[key]({
                currSlide: targetSlide,
                prevSlide: this.currSlide,
                currDistance: Math.abs(slideIndex - targetSlide),
                prevDistance: Math.abs(slideIndex - this.currSlide),
                slideElem,
                slides: this.slides,
                slideIndex,
                progress,
                slideWidth: this.slideWidth,
                wrapperWidth: this.wrapperWidth,
            });
        }
        return props;
    }

    nextSlide() {
        this.moveSlide(this.currSlide + 1)
    }

    prevSlide() {
        this.moveSlide(this.currSlide - 1)
    }

    
    initTouchControls() {

        this.slideWrapper.addEventListener('dragstart', e => { e.preventDefault() })
        this.slideWrapper.style.cursor = "grab"
        let originX, raf;


        const getDragVals = e => {
            const currX = e.touches?.[0]?.clientX ?? e.clientX;
            const deltaX = currX - originX;
            return {
                currX,
                deltaX,
                progress: deltaX / this.slideWidth,
                dir: -Math.sign(deltaX),
            };
        };


        const handleMouseDown = e => {
            e.preventDefault()

            originX = getDragVals(e).currX;
            e.preventDefault()

            // e.touches is for mobile touch Control
            originX = e.touches?.[0]?.clientX ?? e.clientX;
            console.log("Mouse Down")

            bindMoveListeners(true)
            this.slideWrapper.style.cursor = "grabbing"
        }


        const handleMouseMove = e => {
            e.preventDefault();

            if (raf) cancelAnimationFrame(raf);

            raf = requestAnimationFrame(() => {
                const { progress, dir, currX } = getDragVals(e)
                const target = this.currSlide + dir;
                this.slides.forEach((slide, i) => {
                    const props = this.computeAnimProps(target, i, slide, Math.abs(progress));
                    Object.assign(slide.style, props);
                });


                if (Math.abs(progress) >= 1) {
                    this.currSlide += dir;
                    originX = currX;
                }
            })
        };


        const handleMouseUp = e => {
            e.preventDefault()

            if (raf) cancelAnimationFrame(raf)
            const { progress, dir } = getDragVals(e)

            const shouldSnap = Math.abs(progress) > this.snapThreshold;
            const target = shouldSnap ? this.currSlide + dir : this.currSlide

            this.moveSlide(target);

            this.slideWrapper.style.cursor = "grab"
            bindMoveListeners(false)
        };


        const bindMoveListeners = enable => {
            const events = [
                ["touchmove", handleMouseMove, { passive: false }],
                ["mousemove", handleMouseMove],
                ["touchend", handleMouseUp],
                ["mouseup", handleMouseUp],
                ["mouseleave", handleMouseUp],
                ["touchcancel", handleMouseUp]
            ];

            events.forEach(([type, handler, options]) =>
                document[enable ? "addEventListener" : "removeEventListener"](type, handler, options)
            )
        }


        this.slideWrapper.addEventListener("mousedown", handleMouseDown)
    }
}



const getLeft = (slideIndex, currSlide, slideWidth, wrapperWidth, spacing) => (slideWidth + spacing) * (slideIndex - currSlide) + (wrapperWidth - slideWidth) / 2
const lerp = (start, end, t) => start + t * (end - start)

// initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const mySlider = new Slider({
      sliderContainer: ".nd-slider", // use nd-specific selector
      animProps: {
          left({ currSlide, prevSlide, slideIndex, progress, slideWidth, wrapperWidth }) {
              const fromLeft = getLeft(slideIndex, prevSlide, slideWidth, wrapperWidth, 10)
              const toLeft = getLeft(slideIndex, currSlide, slideWidth, wrapperWidth, 10)
              return `${lerp(fromLeft, toLeft, progress)}px`;
          },
      },
      touchControls: true,
      duration: 400,
      easing: "ease-out"
  });

  // safe hookup of nav buttons (only if present)
  const nextBtn = document.querySelector(".next-btn");
  const prevBtn = document.querySelector(".prev-btn");
  if (nextBtn) nextBtn.addEventListener('click', () => mySlider.nextSlide());
  if (prevBtn) prevBtn.addEventListener('click', () => mySlider.prevSlide());

  mySlider.init();
});