"use client";

import { useSendEnquiryMutation } from "@/api";
import { sectionLabelClasses } from "@/constants/homeSectionStyles";
import { EnquiryPayload } from "@smurfelite/types";
import React, { useState } from "react";
import { BsInstagram } from "react-icons/bs";
import { HiOutlineMail } from "react-icons/hi";
import { toast } from "react-toastify";

export const Contact = () => {
  const [contactForm, setContactForm] = useState<EnquiryPayload>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [sendEnquiry, { isLoading: isSendingEnquiry }] =
    useSendEnquiryMutation();

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await sendEnquiry({ ...contactForm });
    if ("error" in result) {
      toast.error("Message not sent. Please try again.");
      return;
    }

    toast.success("Message sent successfully.");
    setContactForm({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  const onChangeHandler = (name: string, value: string) => {
    setContactForm((val) => ({ ...val, [name]: value }));
  };

  return (
    <div
      id="contact_us"
      className="bg-[rgb(29,23,41)] min-h-[740px] text-white max-w-[100vw]"
    >
      <div
        className="max-w-7xl mx-auto grid grid-cols-2 place-items-center max-[900px]:grid-cols-1 max-[900px]:pt-[100px]"
      >
        <div className="p-10">
          <span className={`${sectionLabelClasses} text-[#bbbaba]`}>
            Contact Us
          </span>
          <h2 className="font-[family-name:var(--font-syne)] font-bold">
            Connect with us for personalized support and exceptional service
            today!
          </h2>
          <div className="group flex mt-[30px] gap-5">
            <section
              className="size-[50px] min-w-[50px] grid place-items-center rounded-[10px] bg-primary text-xl cursor-pointer transition-all duration-500 group-hover:bg-white group-hover:text-primary group-hover:[transform:rotateY(180deg)]"
              onClick={() =>
                window.open("https://www.instagram.com/smurf.elite/", "_blank")
              }
            >
              <BsInstagram />
            </section>
            <section className="max-w-[350px] flex items-center">
              <a
                href="https://www.instagram.com/smurf.elite/"
                target="_blank"
                rel="noreferrer"
              >
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">
                  Smurf Elite Instagram
                </h3>
              </a>
            </section>
          </div>
          <div className="group flex mt-[30px] gap-5">
            <section
              className="size-[50px] min-w-[50px] grid place-items-center rounded-[10px] bg-primary text-xl cursor-pointer transition-all duration-500 group-hover:bg-white group-hover:text-primary group-hover:[transform:rotateY(180deg)]"
              onClick={() => window.open("mailto:help@smurfelite.com")}
            >
              <HiOutlineMail />
            </section>
            <section className="max-w-[350px] flex items-center">
              <a href="mailto:help@smurfelite.com">
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">
                  Feel Free to Mail Us
                </h3>
              </a>
            </section>
          </div>
        </div>
        <div className="flex justify-center items-center w-full">
          <form
            onSubmit={(e) => onSubmitHandler(e)}
            className="flex flex-col items-center bg-primary w-[90%] max-w-[503px] p-[60px] relative max-[900px]:mb-[60px] max-[400px]:p-2.5"
          >
            <input
              type="text"
              name="name"
              value={contactForm.name}
              onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
              placeholder="Your Name"
              required
              className="w-full h-[60px] outline-none px-5 py-3.5 mb-5 max-[400px]:px-[10%] max-[400px]:py-[5%]"
            />
            <input
              type="email"
              name="email"
              value={contactForm.email}
              onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
              placeholder="Email Address"
              required
              className="w-full h-[60px] outline-none px-5 py-3.5 mb-5 max-[400px]:px-[10%] max-[400px]:py-[5%]"
            />
            <input
              type="number"
              name="phone"
              value={contactForm.phone}
              onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
              placeholder="Phone Number"
              className="w-full h-[60px] outline-none px-5 py-3.5 mb-5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none max-[400px]:px-[10%] max-[400px]:py-[5%]"
            />
            <textarea
              name="message"
              value={contactForm.message}
              onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
              placeholder="Write a Message"
              required
              rows={7}
              className="w-full px-5 py-3.5 mb-5"
            />
            <button
              type="submit"
              disabled={isSendingEnquiry}
              className="bg-gradient-to-r from-primary-hover to-primary min-h-[60px] py-5 px-[50px] outline-none border border-white text-white font-[family-name:var(--font-syne)] w-[60%]"
            >
              {isSendingEnquiry ? (
                <div
                  className="size-[18px] rounded-full border-t border-r border-white animate-spin mx-auto"
                  aria-label="Sending"
                />
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
