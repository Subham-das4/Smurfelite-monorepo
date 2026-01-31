import { Button } from '@/components/shared'
import React from 'react'
import { SiCounterstrike, SiEpicgames, SiValorant } from 'react-icons/si'

export const Services = () => {
    return (
        <>
            <section className='service_section1'>
                <section className="service_s1_upper">
                    <section className='text_cover'>
                        <span>What we&apos;re offering</span>
                        <h2>Tailored game accounts, meeting all your requirements.</h2>
                    </section>
                </section>
                <section className="service_s1_lower">
                    <div className="service_s1_card">
                        <section className="service_s1_img">
                            <div className="img"></div>

                        </section>
                        <section className="service_s1_logo">
                            <SiCounterstrike />
                        </section>
                        <section className="text_cover">
                            <h2>Counter Strike 2</h2>
                            <p>Counter-Strike 2 is a first-person shooter game with new gameplay mechanics, new maps, and a new economy system.</p>
                            <Button href={'/game/Counter Strike 2'} title={"Buy Now"} />
                        </section>
                    </div>
                    <div className="service_s1_card">
                        <section className="service_s1_img">
                            <div className="img"></div>
                        </section>
                        <section className="service_s1_logo">
                            <SiEpicgames />
                        </section>
                        <section className="text_cover">
                            <h2>Grand Theft Auto : V</h2>
                            <p>
                                GTA V is an action-adventure game set in a sprawling open world where players can explore, steal cars, and cause mayhem.</p>
                            <Button href={'/game/GTA V'} title={"Buy Now"} />
                        </section>
                    </div>
                    <div className="service_s1_card">
                        <section className="service_s1_img">
                            <div className="img"></div>

                        </section>
                        <section className="service_s1_logo">
                            <SiValorant />

                        </section>
                        <section className="text_cover">
                            <h2>Valorant</h2>
                            <p>
                                Valorant is a free-to-play character-based tactical shooter where players battle with unique abilities and precise gunplay.</p>
                            <Button href={'/game/Valorant'} title={"Buy Now"} />
                        </section>
                    </div>
                </section>
            </section>
        </>
    )
}
