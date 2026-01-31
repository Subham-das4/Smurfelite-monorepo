"use client"
import Link from "next/link"
import { useState } from "react"
import logo from '@/assets/smurf_elite_logo.png'
import Image from "next/image"

import instagram from '@/assets/footer/instagram.svg'
import facebook from '@/assets/footer/facebook.svg'
import twitter from '@/assets/footer/twitter.svg'
import { TbClipboardCheck } from "react-icons/tb"
import { HiClipboard } from "react-icons/hi"

export const Footer = () => {
    const [textCopied, setTextCopied] = useState(false)
    return (
        <footer id='footer' className="w-100 py-4 flex-shrink-0  footer2" >
            <div className="container py-4">
                <div className="row gy-4 gx-5">
                    <div className="col-lg-4 col-md-6">
                        <Image src={logo} alt="" style={{ width: "100%" }} className="image-fluid footer_logo"></Image>
                        <p className="small "><strong>From beginner tips to expert guides, SmurfElite is your ultimate gaming resource.</strong></p>
                        <p className="small  mb-0">&copy; Copyrights. All rights reserved. </p>
                    </div>
                    <div className="col-lg-2 col-md-6">
                        <h5 className="text-white mb-3">Quick links</h5>
                        <ul className="list-unstyled ">
                            <li className="hover:scale-110 transition-all duration-300" ><Link href={'/'}>Home</Link></li>
                            <li className="hover:scale-110 transition-all duration-300" ><Link href={'/orders'} >Orders</Link></li>
                            <li className="hover:scale-110 transition-all duration-300" ><Link href={'/privacy-policy'} >Privacy Policy</Link></li>
                        </ul>
                    </div>
                    <div className="col-lg-2 col-md-6">
                        <h5 className="text-white mb-3"> Games</h5>
                        <ul className="list-unstyled ">
                            <li className="hover:scale-110 transition-all duration-300" ><Link href={'/game'}>CS GO</Link></li>
                            <li className="hover:scale-110 transition-all duration-300" ><Link href={'/game'}>Valorant</Link></li>
                            <li className="hover:scale-110 transition-all duration-300"     ><Link href={'/game'}>GTA V</Link></li>
                            {/* <li><a href="">FAQ</a></li> */}
                        </ul>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <h5 className="text-white mb-3">Social Media</h5>

                        <div style={{ display: "flex", gap: "20px" }}>

                            <Image alt='instagram' onClick={() => redirectToSocialMedia('instagram')} src={instagram} width={25} height={25}></Image>
                            <Image alt='facebook' onClick={() => redirectToSocialMedia('facebook')} src={facebook} width={25} height={25}></Image>
                            <Image alt='twitter' onClick={() => redirectToSocialMedia('twitter')} src={twitter} width={25} height={25}></Image>
                        </div>
                        <p className="" style={{ marginBottom: "0", marginTop: "30px" }}>For any queries kindly contact</p>
                        <p className="" >help@smurfelite.com  &nbsp;
                            {textCopied ?
                                <TbClipboardCheck />
                                :
                                <HiClipboard onClick={() => {
                                    setTextCopied(true)
                                    setTimeout(() => {
                                        setTextCopied(false)
                                    }, 2000)
                                    navigator.clipboard.writeText('help@smurfelite.com')
                                }} />
                            }
                        </p>


                    </div>
                </div>
            </div>
        </footer>
    )
}

const redirectToSocialMedia = (site: string) => {
    switch (site) {
        case 'instagram':
            window.open('https://www.instagram.com/smurf.elite/', '_blank');
            break;
        case 'facebook':
            break;
        case 'twitter':
            break;
        default:
            break;
    }

}