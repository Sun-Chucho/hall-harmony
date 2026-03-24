export const SITE_IMAGES = {
  witness: 'https://i.postimg.cc/JzjgPfN7/WITNESS-HALL.jpg',
  kilimanjaro: 'https://i.postimg.cc/9QP8GG2Q/IMG-4071.jpg',
  garden: 'https://i.postimg.cc/YqQKsLk2/IMG-4095.jpg',
  hallD: 'https://i.postimg.cc/5NBT3cq0/IMG-4106.jpg',
  premium: 'https://i.postimg.cc/kGx1f8Sj/IMG-4101.jpg',
  lounge: 'https://i.postimg.cc/7YKMDmqg/IMG-4121.jpg',
  journal: 'https://i.postimg.cc/wv5LrkWQ/IMG-4152.jpg',
  editorial: 'https://i.postimg.cc/G2jTKm2D/IMG-4184.jpg',
} as const;

export const VENUE_IMAGE_BY_ID: Record<string, string> = {
  witness: SITE_IMAGES.witness,
  kilimanjaro: SITE_IMAGES.kilimanjaro,
  'kilimanjaro-garden': SITE_IMAGES.garden,
  'hall-d': SITE_IMAGES.hallD,
};
