import { fetchArtistAlbums } from "../api/spotify";

const fetchArtistDiscography = async (artistId) => {
  try {
    const artistAlbums = await fetchArtistAlbums(artistId);

    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

    const recentAlbums = artistAlbums.items.filter(album => {
      const releaseDate = new Date(album.release_date);
      return !isNaN(releaseDate) && releaseDate >= threeMonthsAgo;
    });

    return recentAlbums;
  } catch (error) {
    console.error('Error fetching artist discography:', error);
    throw error;
  }
};

export default fetchArtistDiscography;