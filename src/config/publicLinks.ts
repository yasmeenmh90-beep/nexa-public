/** Only verified public links. Supply the NEXA repo and booking URL to enable those CTAs. */
export const PUBLIC_LINKS: { portfolio: string; githubProfile: string; linkedin: string; repository: string | null; booking: string | null; demoVideo: string | null; contactEmail: string; desktopLink: string } = {
  portfolio: 'https://yasmeenazmat.com',
  githubProfile: 'https://github.com/yasmeenmh90-beep',
  linkedin: 'https://www.linkedin.com/in/yasmeen-azmat-a02b44340',
  repository: 'https://github.com/yasmeenmh90-beep/nexa-public',
  booking: null,
  demoVideo: null, // e.g. /media/nexa-demo.mp4 after providing the real recording
  contactEmail: 'yasmeenmh.90@gmail.com', // shown on the privacy, terms and security pages
  desktopLink: 'nexa-desktop://open?screen=connections', // opens the installed NEXA desktop app
};
