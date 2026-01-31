"use client";
import React from 'react'
import { NavbarFixed } from './fixed';
import { NavbarMobile } from './mobile';
import { NavbarLarge } from './laptop';

export const Header = () => {
    return (
        <>
            <NavbarFixed />
            <NavbarMobile />
            <NavbarLarge />
        </>
    )
}

