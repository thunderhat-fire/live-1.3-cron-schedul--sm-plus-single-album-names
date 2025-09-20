import _ from "lodash";
import { NavItemType } from "@/shared/Navigation/NavigationItem";

const ncNanoId = _.uniqueId;

const otherPageChildMenus: NavItemType[] = [
  {
    id: ncNanoId(),
    href: "/home-3",
    name: "Home",
  },
  {
    id: ncNanoId(),
    href: "/collection",
    name: "Collection page",
  },
  {
    id: ncNanoId(),
    href: "/search",
    name: "Search page",
  },
  {
    id: ncNanoId(),
    href: "/about",
    name: "Other Pages",
    type: "dropdown",
    children: [
      {
        id: ncNanoId(),
        href: "/about",
        name: "About",
      },
      {
        id: ncNanoId(),
        href: "/contact",
        name: "Contact us",
      },
      {
        id: ncNanoId(),
        href: "/login",
        name: "Login",
      },
      {
        id: ncNanoId(),
        href: "/signup",
        name: "Signup",
      },
      {
        id: ncNanoId(),
        href: "/subscription",
        name: "Subscription",
      },
    ],
  },
];

export const NAVIGATION_DEMO_2: NavItemType[] = [
  {
    id: ncNanoId(),
    href: "/",
    name: "Discover",
    type: "dropdown",
    children: otherPageChildMenus,
  },
  {
    id: ncNanoId(),
    href: "/upload-item",
    name: "Process",
    type: "dropdown",
    children: [
      {
        id: ncNanoId(),
        href: "/upload-item",
        name: "Upload Album",
      },
      {
        id: ncNanoId(),
        href: "/mastering-upload",
        name: "Digital Mastering",
      },
      {
        id: ncNanoId(),
        href: "/analytics",
        name: "Analytics",
      },
    ],
  },
  {
    id: ncNanoId(),
    href: "/help-center",
    name: "Help Center",
    type: "dropdown",
    children: [
      {
        id: ncNanoId(),
        href: "/help-center",
        name: "Help Center Home",
      },
      {
        id: ncNanoId(),
        href: "/contact",
        name: "Contact Support",
      },
      {
        id: ncNanoId(),
        href: "/seller-guide",
        name: "Seller Guide",
      },
      {
        id: ncNanoId(),
        href: "/buyer-protection",
        name: "Buyer Protection",
      },
    ],
  },
];
