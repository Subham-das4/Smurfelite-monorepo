"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export const Carousel: React.FC<CarouselProps> = ({ sliderData }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const slideLength = sliderData.length;

  const autoScroll = true;
  let slideInterval: NodeJS.Timeout;
  const intervalTime = 5000;

  const nextSlide = () => {
    setCurrentSlide(currentSlide === slideLength - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? slideLength - 1 : currentSlide - 1);
  };

  function auto() {
    const interval = setInterval(nextSlide, intervalTime);
    return () => clearInterval(interval);
  }

  useEffect(() => {
    if (autoScroll) {
      return auto();
    }
  }, [currentSlide]);

  return (
    <div className="slider  ">
      <AiOutlineArrowLeft className="arrow prev" onClick={prevSlide} />
      <AiOutlineArrowRight className="arrow next" onClick={nextSlide} />
      {sliderData.map((slide, index) => {
        return (
          <div
            className={index === currentSlide ? "slide current" : "slide"}
            key={index}
          >
            {index === currentSlide && (
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <Image
                  src={slide.image}
                  alt="slide"
                  className="image"
                  fill
                  style={{ objectFit: "cover" }}
                  priority={index === 0}
                />
                <div className="content">
                  <h2>{slide.title}</h2>
                  <p>{slide.description}</p>
                  <hr />
                  <Link href={"/game"}>
                    <div className="slider_button_container">
                      <button
                        onClick={(e) =>
                          sessionStorage.setItem("selectedGame", slide.game)
                        }
                        className="slider_button"
                      >
                        Buy Now
                      </button>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
