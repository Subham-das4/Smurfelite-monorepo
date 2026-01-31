"use client";
import { useSendEnquiryMutation } from '@/api';
import React, { useState } from 'react'
import { BsInstagram } from 'react-icons/bs';
import { HiOutlineMail } from 'react-icons/hi';
import { toast } from 'react-toastify';

export const Contact = () => {
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });

    const [sendEnquiry, { isLoading: isSendingEnquiry }] = useSendEnquiryMutation();

    const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const res = await sendEnquiry({ ...contactForm });
        if (res === undefined) {
            toast.error("Message not sent.");
        } else {
            toast.success("Message sent successfully.");
        }
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
        <div className="contact_wrapper row" id="contact_us">
            <div className="contact">
                <div className="contact_left">
                    <span className="title_arrow">Contact Us</span>
                    <h2>
                        Connect with us for personalized support and exceptional service
                        today!
                    </h2>
                    <div>
                        <section
                            className="icon"
                            onClick={(e) =>
                                window.open("https://www.instagram.com/smurf.elite/", "_blank")
                            }
                        >
                            <BsInstagram />
                        </section>
                        <section>
                            <a
                                href="https://www.instagram.com/smurf.elite/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <h3>Smurf Elite Instagram</h3>
                            </a>
                        </section>
                    </div>
                    <div>
                        <section
                            className="icon"
                            onClick={(e) => window.open("mailto:help@smurfelite.com")}
                        >
                            <HiOutlineMail />
                        </section>
                        <section>
                            <a href="mailto:help@smurfelite.com">
                                <h3>Feel Free to Mail Us</h3>
                            </a>
                        </section>
                    </div>
                </div>
                <div className="contact_right">
                    <form onSubmit={(e) => onSubmitHandler(e)}>
                        <input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
                            placeholder="Your Name"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
                            placeholder="Email Address"
                            required
                        />
                        <input
                            type="number"
                            name="phone"
                            value={contactForm.phone}
                            onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
                            placeholder="Phone Number"
                        />
                        <textarea
                            cols={36}
                            name="message"
                            value={contactForm.message}
                            onChange={(e) => onChangeHandler(e.target.name, e.target.value)}
                            placeholder="Write a Message"
                            required
                            rows={7}
                        ></textarea>
                        <button type="submit" disabled={isSendingEnquiry}>
                            {isSendingEnquiry ? (
                                <section className="loading"></section>
                            ) : (
                                "Send Message"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

