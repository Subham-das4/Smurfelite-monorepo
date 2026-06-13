import { Button } from "@/components/shared";
import Image, { StaticImageData } from "next/image";
import React from "react";
import { IconType } from "react-icons";
import { SiCounterstrike, SiEpicgames, SiValorant } from "react-icons/si";

import cs2CardImage from "@/assets/HomePage/Service/cs2_card_image.png";
import gtavCardImage from "@/assets/HomePage/Service/gtav_card_image.jpg";
import valorantCardImage from "@/assets/HomePage/Service/valorant_card_image.jpg";
import serviceHeroBg from "@/assets/HomePage/Service/service_section1_background.jpg";
import { sectionLabelClasses } from "@/constants/homeSectionStyles";

interface ServiceCardData {
  title: string;
  description: string;
  href: string;
  image: StaticImageData;
  Icon: IconType;
}

const servicesData: ServiceCardData[] = [
  {
    title: "Counter Strike 2",
    description:
      "Counter-Strike 2 is a first-person shooter game with new gameplay mechanics, new maps, and a new economy system.",
    href: "/game/Counter Strike 2",
    image: cs2CardImage,
    Icon: SiCounterstrike,
  },
  {
    title: "Grand Theft Auto : V",
    description:
      "GTA V is an action-adventure game set in a sprawling open world where players can explore, steal cars, and cause mayhem.",
    href: "/game/GTA V",
    image: gtavCardImage,
    Icon: SiEpicgames,
  },
  {
    title: "Valorant",
    description:
      "Valorant is a free-to-play character-based tactical shooter where players battle with unique abilities and precise gunplay.",
    href: "/game/Valorant",
    image: valorantCardImage,
    Icon: SiValorant,
  },
];

const ServiceCard: React.FC<{ service: ServiceCardData }> = ({ service }) => {
  const { title, description, href, image, Icon } = service;

  return (
    <div
      className="group max-w-[383px] relative -translate-y-[255px] rounded-[10px] overflow-hidden border border-[rgb(235,235,235)] shadow-[0_0_10px_rgba(0,0,0,0.171)]"
    >
      <section
        className="relative h-[255px] overflow-hidden before:absolute before:top-1/2 before:left-1/2 before:z-10 before:h-full before:w-0 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-t-[10px] before:border-b-[5px] before:border-primary before:bg-[#10082986] before:transition-all before:duration-500 before:content-[''] group-hover:before:w-full"
      >
        <Image
          src={image}
          alt=""
          fill
          className="object-cover transition-all duration-500 group-hover:scale-[1.09]"
          sizes="(min-width: 1000px) 33vw, (min-width: 550px) 50vw, 100vw"
        />
      </section>
      <section
        className="w-[120px] h-[120px] bg-[rgb(255,251,251)] rounded-full mx-auto -translate-y-1/2 -mb-5 relative z-[15] shadow-[0_0_10px_rgba(0,0,0,0.171)] flex justify-center items-center before:absolute before:inset-0 before:rounded-full before:-z-10 before:scale-0 before:bg-primary before:transition-all before:duration-500 before:[transition-timing-function:cubic-bezier(0.62,0.21,0.45,1.52)] before:content-[''] group-hover:before:scale-90"
      >
        <Icon className="text-[2.7rem] fill-primary group-hover:fill-white" />
      </section>
      <section className="w-full flex flex-col justify-center items-center text-center p-[30px]">
        <h2 className="font-[family-name:var(--font-syne)] text-[1.75rem] font-bold">
          {title}
        </h2>
        <p className="text-[1.2rem] text-[#6a6a6a]">{description}</p>
        <Button href={href} title="Buy Now" />
      </section>
    </div>
  );
};

export const Services = () => {
  return (
    <section className="mx-auto">
      <section className="relative h-[569px] grid place-items-center">
        <Image
          src={serviceHeroBg}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <section
          className="relative z-10 max-w-7xl mx-auto text-center flex flex-col items-center -translate-y-[75%] max-[472px]:-translate-y-1/2 max-[352px]:-translate-y-[75%]"
        >
          <span className={`${sectionLabelClasses} text-[1.1rem] py-5`}>
            What we&apos;re offering
          </span>
          <h2
            className="font-[family-name:var(--font-syne)] font-bold max-w-[700px] text-wrap text-[2.7rem] max-[352px]:text-[2rem]"
          >
            Tailored game accounts, meeting all your requirements.
          </h2>
        </section>
      </section>
      <section
        className="max-w-7xl mx-auto grid place-items-center grid-cols-3 max-[1000px]:grid-cols-2 max-[550px]:grid-cols-1 gap-x-2.5 gap-y-5 -mb-[150px]"
      >
        {servicesData.map((service) => (
          <ServiceCard key={service.title} service={service} />
        ))}
      </section>
    </section>
  );
};
