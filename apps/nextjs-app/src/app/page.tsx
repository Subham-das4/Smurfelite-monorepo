import { Carousel } from "@/components/shared";
import { NextPage } from "next";
import React from "react";

import valorant_image from "@/assets/carousel/carousel_valorant.jpg";
import cs2_image from "@/assets/carousel/carousel_cs2_2.jpg";
import gtav_image from "@/assets/carousel/carousel_gtav_2.jpg";
import { sliderData } from "@/constants";
import { About, Contact, Services } from "@/components/pages/home";

sliderData[0].image = valorant_image;
sliderData[1].image = cs2_image;
sliderData[2].image = gtav_image;

const Home: NextPage = () => {
  return (
    <>
      <Carousel sliderData={sliderData} />
      <About />
      <Services />
      <Contact />
    </>
  );
};

export default Home;
