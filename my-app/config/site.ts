export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "DatasetCo",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  leftNav: [
    {
      title: "Repositories",
      href: "/repositories",
    },
    {
      title: "About",
      href: "/about",
    },
  ],
  rightNav: [
    {
      title: "Login",
      href: "/login",
    },
    {
      title: "Signup",
      href: "/signup",
    },
  ],
  links: {
    github: "https://github.com/team4169/datasetcolab",
    docs: "https://ui.shadcn.com",
  },
}
