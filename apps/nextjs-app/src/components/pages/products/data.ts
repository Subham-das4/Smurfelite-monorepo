import { ProductListing } from "./types";

export const GAME_OPTIONS = [
  "CS:GO / CS2",
  "Valorant",
  "GTA V",
  "League of Legends",
  "Fortnite",
];

export const PLATFORM_OPTIONS = ["All", "Steam", "Epic", "Riot", "Social Club"];

export const RANK_TIER_OPTIONS = [
  { value: "any", label: "Any Rank" },
  { value: "high", label: "High Tier (Global/Radiant)" },
  { value: "mid", label: "Mid Tier (DMG/Ascendant)" },
  { value: "smurf", label: "Smurf / Unranked" },
];

export const SORT_OPTIONS = [
  { value: "featured", label: "Sort by: Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
];

export const DUMMY_PRODUCTS: ProductListing[] = [
  {
    id: "prod-001",
    gameType: "CS:GO 2",
    title: "Global Elite - Prime Ready",
    price: 89.99,
    originalPrice: 120.0,
    rating: 4.9,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDR0ui1kxSZqF37fAC5ZDlP-yxL8Pl2xDU9tzl6f6s9IWapYNI5EIweTziNCGrS6ULdsoBxIwJoxFHSlMmJxtiitoswVgSywdFXoZKE5SyBcxMZxFdiROK6SEEp91e-Sw9KuTiZ0kdGGx0082cmXjkvxeZqvbVQhvRfM80GAs1VpnSTNdz2RdyP6ibxMS3ShoeqNdOi2ne5-nqOD5aI4122zvlzHoXsUuIMXVOUBkpPijZgLHNNc5L325CE1biTRjKvKQEWK7Kn5kE",
    imageAlt: "Counter Strike Character",
    badge: { label: "Prime Status", variant: "prime" },
    platform: {
      name: "Steam",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC_fCvwlsO0Cd30gZzhDdpbrvh11gTojVuMSbIiPnc_1Sa37PwI2a9Qso0XhRNQo5FtKqNLLPF56uvOLLd2CN2CIXk8VW0QI-2wu6WlbcdaeZJ_Fc47KStJT8Qk36EAFzC4keJoDtja4sUMLrx10id2lxyVZxZPwo3375LaasSbZpzWdXMROmHnbvK8wKKPLkak4c3dCWSCZNrn0kDrXc6dD3k5k2DSQI3zjDiwA_sxsHo4Zt03FduyiQ50nBNPDYVDU_zdK2hFjno",
      bgColor: "bg-primary",
    },
    features: [
      "2000+ Hours Played",
      "10 Year Veteran Coin",
      "No Bans on Record",
    ],
  },
  {
    id: "prod-002",
    gameType: "Valorant",
    title: "Radiant Account - NA",
    price: 199.0,
    originalPrice: 250.0,
    rating: 5.0,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCm5Hko8rnhRJpBTmI7asHv0TIKmSh-lGOao17ZGczy9cIMTq7CtximYsBSygVLzeU91C0k2b9EohfA6rzWDsWKZC_Yb6q3HW3y5sAqFnlnSdMDwYOOLDUHOSgeF_sKMr5yaWwRqZxpOblPeNXK5QItcdr8QgnA4hMGtVygLQTi6eqXE_nf_E6VoQySujOXgosCP4WAIy-gLJmrxdLidsnKQBYb8KwmJzK4TDdomg3HBgFNdHdNrfYwSHzxui5GXrrcVnQp9xVyN00",
    imageAlt: "Valorant Character",
    badge: { label: "Hot Deal", variant: "hot-deal" },
    platform: {
      name: "Riot",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDSIUoJPr0XvVheSq77ZIXE4RfkcFCjsin2cOoylM93hs3iZUbdnUOlZLxJEypIlw-1cdbNbFOaoDvjNfYLxFIE9V1xnULpFelpQrZ_RGHZMpU8kq0IedIhAV5sdgfBl_Wej47napfFnIUwByvV2l-d_ac5H2R_PsIgDL7Sh2YYA_LtxDVHlU9IG3J3WRhUdM1PPhWrtmyA69bKSRMrdQhd24V1PfnT2FLR8Ic6CMShqysC4pzzObSBVnLZZMZLHalJq6m-iVFYfL0",
      bgColor: "bg-red-600",
    },
    features: [
      "All Agents Unlocked",
      "Reaver Vandal Skin",
      "Current Act Battlepass",
    ],
  },
  {
    id: "prod-003",
    gameType: "GTA V Online",
    title: "Billionaire Modded Acc",
    price: 35.0,
    rating: 4.8,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Fdfe2YxhAwJg1ZVVe8LvlbQRNCDhPxqWGOd2vXOD1_Uy7_xlKWNgN513rAs4eEzcnxKtoofF099jb1bQsRkJ1mZeYRk8nivUTukolO-6s3JEF6gSpY0oSmqPgROhUvUXBgiJ4eqNjBYFiZTegZERHgyGPBdIxDdWD6LMXpixwuMvQHv18vTBnDlGPVbwy_aRlTnimUQdWgBDthDSyGlkht2br0s-5KC0-Vee0IzC0Kyv_yP0940z3mwEBk-yZqyc2nfCFopYTj0",
    imageAlt: "GTA V Car",
    platform: {
      name: "Epic",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDFmQdf7PbdbzBkxxnuad2SpxUfuK7owjHP6-fij2PlSKCeMI6GadhkzkInwXcstuqUTpfnqVwEFQ36rOnaWxl-Of5h3NHaorx-KlWaByY3RNAvBDuZkYhFsImM2VR66fwUTCs9uoVGycaadevwXMsM-VfEA2wOwKuX0q4kDiww6Z2yoO54Y4oyI7Of-1FBwlOmP-zeYCtKHjSXE_AZZCCKCw1ROhV44FKTo7uX_sIthwqIoCmXoq-b-ssIwi_spdobhd-vSxAeTaY",
      bgColor: "bg-black",
    },
    features: ["$5 Billion Cash", "Level 500+", "All Properties Purchased"],
  },
  {
    id: "prod-004",
    gameType: "League of Legends",
    title: "Diamond Smurf - EUW",
    price: 29.99,
    originalPrice: 45.0,
    rating: 4.7,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAYETAjN5tLmMvc64IUY4cpGuxckv21hnCKF6_qAZbRyNTQshOQihuOSZ3T0m8AaDO0LnXx8pCmjGxxeoUMKaAr6rFcC0BkOihOMQ7e9dqiCEUD1dwCDOKYg71klg-UowpKgowOaeJjaKcRrFx60RQqBPH_Z3bcfcYTWPAveudolB5E7Yeq17peX10xIYNeOesjKE-3ojtsRNx2fR3P4fcoF0522N7Q0vDur8X9rFcoUMotb135mYPsNzRltIP7FwS_Pbqd1Jj7_R4",
    imageAlt: "League of Legends Style Graphic",
    platform: {
      name: "Riot",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB2hYc-HRd57RZxcn6wyQAsLCrOMIB_PQ-mwfrkfXQwaPdNmIjDLk15Ab1ARG8yLscstMYg-HwEZraeVinK3Rso6iCETKueO_WXDu4apRVACx4rGiaKn5H4iX4YhxoAuYTqKuzV16gDoz7I1VPIv0Mv0Ve6WOK2L_4LEfwpT92VYdxuzTQGxobbtOSjSvJxaD82pGNzwi_c9y7JAuV7t_wWGEjsqP4-1kg77Okv8sjrSdK38-TZ8rrVKlRBEf8dn1IlALAWoo3aPoY",
      bgColor: "bg-blue-600",
    },
    features: ["50,000 Blue Essence", "Handleveled", "Fresh MMR"],
  },
  {
    id: "prod-005",
    gameType: "Fortnite",
    title: "OG Skull Trooper + Black Knight",
    price: 599.0,
    originalPrice: 800.0,
    rating: 5.0,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDTyFvLrzVsHvIT1pD990ZejewQDducRI_IxztVSszePBaOMn5WQwBhCgMkO3IXXnDQpciFxbb9CnNggHs0sE-y4QLetmG8D3M5FBXDBd6aJWtJBDcO8W3mwiLpgyVw3EhP9DHJ9sWSJhrPnu2Oaa_Yf9-s5OnCwUbVareIRw4Ahi66pSsLgb_rnvzwsgtoiF_hKXU1OdSrod3hJGyvNjRSLR3zuE6EMXX2ca5sBM16Z9ymhFrB7g48kH_-_cNYktpu4bUVu7t8kEo",
    imageAlt: "Fortnite Character Abstract",
    platform: {
      name: "Epic",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDaWw17qL9F1Jy9FMCtm67_fu7QJV_zS714zTZv8F52v5Bj3u82IA06qKYltmA_4jNa498wv07ErWAe46yf9tV2dQ4ZRxgJ2iyQ0_wRhPyWqbGQMWiDf0ix1qsz7T2MDKEs0mzTReZZNAh-ymN_OOHce83cKdLYsI6p8yOabL2fuzpHRWCDmVU4mBc3KeyJLFriQ_-8r6OCcuWQT0ctjLAS83FfwajPPg9MHbCWpIN51D1iFvYGN56zoDh8guI8IkKTf2Su9ad6BOI",
      bgColor: "bg-black",
    },
    features: ["200+ Skins", "Full Access Email", "PSN/Xbox Linkable"],
  },
  {
    id: "prod-006",
    gameType: "Apex Legends",
    title: "Predator Rank S16",
    price: 149.99,
    rating: 4.5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAvMK4cEKkc-8DdvMLAKugHb1tHx_868Us_GldOVvrYEw6v0W6ImjCpHIbDfc7uPtNzTOuneGuxP1In3lgSbslLtnmII81AuLZ01AT52fzCxAkFvoW86Hnd4X9GHx_4uB8s5hvGsGoro-G-sy7wUnS57CCvEKBKjFu4DFtxdyBtrojw85N-O1sTa8q0AdYkCDgGsT0VOBLAM9oGhFvOMu4uc4_6rhGt-wMC411P7aIYA1htsNPq5RnTEahzKPdbFpxPPs3hP8BSOo",
    imageAlt: "Apex Legends Style",
    platform: {
      name: "Origin",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVkb5ElBgzIq9NUDDpx5V5T1FCjUKzQtCAhIYvmE5HK1-1x8cpt74xEjYiaXPU1FSn9S-70utOY1LyYl-r_COJ9pYAy5-ob7qUxFyOTCqP1nQWoSSmCh2AcGyjOTGc3xO2vB0VHrsYAMlWX5wiuRp5nK9evDoaHrPe5wSx-kOm9P9GaW2Sx-aX5PUNIwE73E2KJxbuD9wiWNq7dYjjuWIHFSRrZxT_Gj5Y-u9t6sCjyGsMEIvsmK-Q4VFTYa06vD9jCOA5SOZlsCo",
      bgColor: "bg-red-600",
    },
    features: ["4k Damage Badge", "20 Kill Badge", "Heirloom Shards (150/150)"],
  },
  {
    id: "prod-007",
    gameType: "Apex Legends",
    title: "Predator Rank S16",
    price: 149.99,
    rating: 4.5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAvMK4cEKkc-8DdvMLAKugHb1tHx_868Us_GldOVvrYEw6v0W6ImjCpHIbDfc7uPtNzTOuneGuxP1In3lgSbslLtnmII81AuLZ01AT52fzCxAkFvoW86Hnd4X9GHx_4uB8s5hvGsGoro-G-sy7wUnS57CCvEKBKjFu4DFtxdyBtrojw85N-O1sTa8q0AdYkCDgGsT0VOBLAM9oGhFvOMu4uc4_6rhGt-wMC411P7aIYA1htsNPq5RnTEahzKPdbFpxPPs3hP8BSOo",
    imageAlt: "Apex Legends Style",
    platform: {
      name: "Origin",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVkb5ElBgzIq9NUDDpx5V5T1FCjUKzQtCAhIYvmE5HK1-1x8cpt74xEjYiaXPU1FSn9S-70utOY1LyYl-r_COJ9pYAy5-ob7qUxFyOTCqP1nQWoSSmCh2AcGyjOTGc3xO2vB0VHrsYAMlWX5wiuRp5nK9evDoaHrPe5wSx-kOm9P9GaW2Sx-aX5PUNIwE73E2KJxbuD9wiWNq7dYjjuWIHFSRrZxT_Gj5Y-u9t6sCjyGsMEIvsmK-Q4VFTYa06vD9jCOA5SOZlsCo",
      bgColor: "bg-red-600",
    },
    features: ["4k Damage Badge", "20 Kill Badge", "Heirloom Shards (150/150)"],
  },
  {
    id: "prod-009",
    gameType: "Apex Legends",
    title: "Predator Rank S16",
    price: 149.99,
    rating: 4.5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAvMK4cEKkc-8DdvMLAKugHb1tHx_868Us_GldOVvrYEw6v0W6ImjCpHIbDfc7uPtNzTOuneGuxP1In3lgSbslLtnmII81AuLZ01AT52fzCxAkFvoW86Hnd4X9GHx_4uB8s5hvGsGoro-G-sy7wUnS57CCvEKBKjFu4DFtxdyBtrojw85N-O1sTa8q0AdYkCDgGsT0VOBLAM9oGhFvOMu4uc4_6rhGt-wMC411P7aIYA1htsNPq5RnTEahzKPdbFpxPPs3hP8BSOo",
    imageAlt: "Apex Legends Style",
    platform: {
      name: "Origin",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVkb5ElBgzIq9NUDDpx5V5T1FCjUKzQtCAhIYvmE5HK1-1x8cpt74xEjYiaXPU1FSn9S-70utOY1LyYl-r_COJ9pYAy5-ob7qUxFyOTCqP1nQWoSSmCh2AcGyjOTGc3xO2vB0VHrsYAMlWX5wiuRp5nK9evDoaHrPe5wSx-kOm9P9GaW2Sx-aX5PUNIwE73E2KJxbuD9wiWNq7dYjjuWIHFSRrZxT_Gj5Y-u9t6sCjyGsMEIvsmK-Q4VFTYa06vD9jCOA5SOZlsCo",
      bgColor: "bg-red-600",
    },
    features: ["4k Damage Badge", "20 Kill Badge", "Heirloom Shards (150/150)"],
  },
  {
    id: "prod-008",
    gameType: "Apex Legends",
    title: "Predator Rank S16",
    price: 149.99,
    rating: 4.5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAvMK4cEKkc-8DdvMLAKugHb1tHx_868Us_GldOVvrYEw6v0W6ImjCpHIbDfc7uPtNzTOuneGuxP1In3lgSbslLtnmII81AuLZ01AT52fzCxAkFvoW86Hnd4X9GHx_4uB8s5hvGsGoro-G-sy7wUnS57CCvEKBKjFu4DFtxdyBtrojw85N-O1sTa8q0AdYkCDgGsT0VOBLAM9oGhFvOMu4uc4_6rhGt-wMC411P7aIYA1htsNPq5RnTEahzKPdbFpxPPs3hP8BSOo",
    imageAlt: "Apex Legends Style",
    platform: {
      name: "Origin",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVkb5ElBgzIq9NUDDpx5V5T1FCjUKzQtCAhIYvmE5HK1-1x8cpt74xEjYiaXPU1FSn9S-70utOY1LyYl-r_COJ9pYAy5-ob7qUxFyOTCqP1nQWoSSmCh2AcGyjOTGc3xO2vB0VHrsYAMlWX5wiuRp5nK9evDoaHrPe5wSx-kOm9P9GaW2Sx-aX5PUNIwE73E2KJxbuD9wiWNq7dYjjuWIHFSRrZxT_Gj5Y-u9t6sCjyGsMEIvsmK-Q4VFTYa06vD9jCOA5SOZlsCo",
      bgColor: "bg-red-600",
    },
    features: ["4k Damage Badge", "20 Kill Badge", "Heirloom Shards (150/150)"],
  },
  {
    id: "prod-010",
    gameType: "Apex Legends",
    title: "Predator Rank S16",
    price: 149.99,
    rating: 4.5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAvMK4cEKkc-8DdvMLAKugHb1tHx_868Us_GldOVvrYEw6v0W6ImjCpHIbDfc7uPtNzTOuneGuxP1In3lgSbslLtnmII81AuLZ01AT52fzCxAkFvoW86Hnd4X9GHx_4uB8s5hvGsGoro-G-sy7wUnS57CCvEKBKjFu4DFtxdyBtrojw85N-O1sTa8q0AdYkCDgGsT0VOBLAM9oGhFvOMu4uc4_6rhGt-wMC411P7aIYA1htsNPq5RnTEahzKPdbFpxPPs3hP8BSOo",
    imageAlt: "Apex Legends Style",
    platform: {
      name: "Origin",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVkb5ElBgzIq9NUDDpx5V5T1FCjUKzQtCAhIYvmE5HK1-1x8cpt74xEjYiaXPU1FSn9S-70utOY1LyYl-r_COJ9pYAy5-ob7qUxFyOTCqP1nQWoSSmCh2AcGyjOTGc3xO2vB0VHrsYAMlWX5wiuRp5nK9evDoaHrPe5wSx-kOm9P9GaW2Sx-aX5PUNIwE73E2KJxbuD9wiWNq7dYjjuWIHFSRrZxT_Gj5Y-u9t6sCjyGsMEIvsmK-Q4VFTYa06vD9jCOA5SOZlsCo",
      bgColor: "bg-red-600",
    },
    features: ["4k Damage Badge", "20 Kill Badge", "Heirloom Shards (150/150)"],
  },
  {
    id: "prod-011",
    gameType: "Apex Legends",
    title: "Predator Rank S16",
    price: 149.99,
    rating: 4.5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAvMK4cEKkc-8DdvMLAKugHb1tHx_868Us_GldOVvrYEw6v0W6ImjCpHIbDfc7uPtNzTOuneGuxP1In3lgSbslLtnmII81AuLZ01AT52fzCxAkFvoW86Hnd4X9GHx_4uB8s5hvGsGoro-G-sy7wUnS57CCvEKBKjFu4DFtxdyBtrojw85N-O1sTa8q0AdYkCDgGsT0VOBLAM9oGhFvOMu4uc4_6rhGt-wMC411P7aIYA1htsNPq5RnTEahzKPdbFpxPPs3hP8BSOo",
    imageAlt: "Apex Legends Style",
    platform: {
      name: "Origin",
      iconUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVkb5ElBgzIq9NUDDpx5V5T1FCjUKzQtCAhIYvmE5HK1-1x8cpt74xEjYiaXPU1FSn9S-70utOY1LyYl-r_COJ9pYAy5-ob7qUxFyOTCqP1nQWoSSmCh2AcGyjOTGc3xO2vB0VHrsYAMlWX5wiuRp5nK9evDoaHrPe5wSx-kOm9P9GaW2Sx-aX5PUNIwE73E2KJxbuD9wiWNq7dYjjuWIHFSRrZxT_Gj5Y-u9t6sCjyGsMEIvsmK-Q4VFTYa06vD9jCOA5SOZlsCo",
      bgColor: "bg-red-600",
    },
    features: ["4k Damage Badge", "20 Kill Badge", "Heirloom Shards (150/150)"],
  },
];
