import { Button } from "@/components/shared";
import React from "react";
import { LiaSteam } from "react-icons/lia";
import { SiEpicgames } from "react-icons/si";

export const About: React.FC = () => {
  return (
    <div className="about_container row" id="about">
      <div className="about_wrapper">
        <section className=" about_left  col-md-6 col-12">
          <section
            style={{ color: "black" }}
            className="about_left_left col-md-5 col-12 d-none d-md-flex"
          >
            <section className="about_left_left_upper col-12 shiny_glass_effect"></section>
            <section className="about_left_left_lower col-12 shiny_glass_effect">
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
          <section className="about_left_right col-md-6 col-12">
            <section className="img shiny_glass_effect"></section>
          </section>
        </section>
        <section className=" about_right col-md-6 col-11">
          <div className="row">
            <span className="welcome_text">Welcome to SmurfElite</span>
          </div>
          <div className="row">
            <span className="about_right_heading">We Made Digital</span>
            <span className="about_right_heading">Shopping Very Simple</span>
          </div>
          <div className="row">
            <p className="about_right_para1">
              Effortless online shopping provides a user-friendly interface,
              quick navigation, and reliable transactions, ensuring a
              hassle-free and enjoyable purchasing process.
            </p>
          </div>
          <div className="row">
            <section className="about_right_icon_text">
              <section className="icon_container">
                <LiaSteam />
              </section>
              <section>
                <span>Quality Game Accounts</span>
                <p>
                  Our game accounts guarantee trustworthiness, hassle-free
                  transactions, and a zero-ban assurance, ensuring a secure and
                  enjoyable gaming experience for all players.
                </p>
              </section>
            </section>
          </div>
          <div className="row">
            <section className="about_right_icon_text">
              <section className="icon_container">
                <SiEpicgames />
              </section>
              <section>
                <span>Best Shopping Assistance</span>
                <p>
                  Need help choosing or buying accounts? Contact us for expert
                  assistance and personalized guidance throughout the process.
                  We&apos;re here for you!
                </p>
              </section>
            </section>
          </div>
          <div className="about_right_button">
            <Button title={"Contact Us"} href={"#contact_us"} />
          </div>
        </section>
      </div>
    </div>
  );
};
