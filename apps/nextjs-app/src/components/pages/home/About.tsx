import { Button } from "@/components/shared";
import Image from "next/image";
import React from "react";
import { LiaSteam } from "react-icons/lia";
import { SiEpicgames } from "react-icons/si";

import upperImg from "@/assets/HomePage/About/about_left_left_upper.jpg";
import lowerImg from "@/assets/HomePage/About/about_left_left_lower.jpg";
import mainImg from "@/assets/HomePage/About/about_left_right_image.jpg";
import { sectionLabelClasses } from "@/constants/homeSectionStyles";

const headingClasses =
  "font-[family-name:var(--font-syne)] text-5xl leading-[4.5rem] font-semibold text-black";

const iconContainerClasses =
  "bg-[#f4f3fb] text-primary text-[3.5rem] flex items-center justify-center border-t-[3px] border-primary px-1.5 w-[90px] min-h-[100px] rounded-b-[45px] mb-5 transition-all duration-400 hover:bg-primary hover:text-white";

const iconTextClasses =
  "flex max-[500px]:flex-col max-[500px]:items-center gap-5";

const iconSubheadingClasses =
  "font-[family-name:var(--font-syne)] text-xl font-semibold text-black";

export const About: React.FC = () => {
  return (
    <div id="about" className="hidden md:block min-h-[890px] max-w-[100vw]">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between max-lg:p-0">
        <section
          className="w-full md:w-1/2 min-h-[700px] flex flex-wrap px-2.5 rounded-[10px]"
        >
          <section
            className="hidden md:flex md:w-5/12 flex-col justify-between min-h-[700px] px-2.5 text-black"
          >
            <section
              className="relative h-[72.5%] overflow-hidden rounded-[10px] max-lg:rounded-none shiny-glass"
            >
              <Image
                src={upperImg}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 768px) 20vw, 0vw"
              />
            </section>
            <section
              className="relative h-[25%] overflow-hidden rounded-[10px] max-lg:rounded-none shiny-glass"
            >
              <Image
                src={lowerImg}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 768px) 20vw, 0vw"
              />
              {/* <div className="about_experience_years row">
                         <section className='logo col-4'><GiStarMedal/></section>
                         <section className="col-5">10 Years</section>
                      </div>
                      <div className="about_experience_text row">
                          <div className="row">Working</div>
                          <div className="row">Experience</div>
                      </div> */}
            </section>
          </section>
          <section className="w-full md:w-1/2 min-h-[700px]">
            <section
              className="relative h-full overflow-hidden rounded-[10px] max-lg:rounded-none shiny-glass"
            >
              <Image
                src={mainImg}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 768px) 25vw, 0vw"
              />
            </section>
          </section>
        </section>
        <section
          className="w-11/12 md:w-1/2 min-h-[700px] flex flex-col px-2.5 text-[#6a6a6a] max-lg:px-5"
        >
          <div>
            <span className={sectionLabelClasses}>Welcome to SmurfElite</span>
          </div>
          <div>
            <span className={headingClasses}>We Made Digital</span>
            <span className={headingClasses}>Shopping Very Simple</span>
          </div>
          <div>
            <p className="py-5">
              Effortless online shopping provides a user-friendly interface,
              quick navigation, and reliable transactions, ensuring a
              hassle-free and enjoyable purchasing process.
            </p>
          </div>
          <div className="my-auto mb-6 border-b border-[#6a6a6a]/34">
            <section className={iconTextClasses}>
              <section className={iconContainerClasses}>
                <LiaSteam />
              </section>
              <section>
                <span className={iconSubheadingClasses}>
                  Quality Game Accounts
                </span>
                <p className="pt-2.5 leading-[1.9rem]">
                  Our game accounts guarantee trustworthiness, hassle-free
                  transactions, and a zero-ban assurance, ensuring a secure and
                  enjoyable gaming experience for all players.
                </p>
              </section>
            </section>
          </div>
          <div className="my-auto">
            <section className={iconTextClasses}>
              <section className={iconContainerClasses}>
                <SiEpicgames />
              </section>
              <section>
                <span className={iconSubheadingClasses}>
                  Best Shopping Assistance
                </span>
                <p className="pt-2.5 leading-[1.9rem]">
                  Need help choosing or buying accounts? Contact us for expert
                  assistance and personalized guidance throughout the process.
                  We&apos;re here for you!
                </p>
              </section>
            </section>
          </div>
          <div className="mt-auto">
            <Button title={"Contact Us"} href={"#contact_us"} />
          </div>
        </section>
      </div>
    </div>
  );
};
