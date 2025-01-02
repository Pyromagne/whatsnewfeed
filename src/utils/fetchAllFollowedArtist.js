import { fetchFollowedArtists, fetchFollowedArtistsCursor } from "../api/spotify";

const fetchAllFollowedArtists = async () => {
    let allArtists = [];
    let nextCursor = null;
    let moreDataAvailable = true;
  
    try {
      while (moreDataAvailable) {
        const data = nextCursor
          ? await fetchFollowedArtistsCursor(nextCursor)
          : await fetchFollowedArtists();
  
        if (data.artists && data.artists.items) {
          allArtists.push(...data.artists.items);
  
          if (data.artists.cursors && data.artists.cursors.after) {
            nextCursor = data.artists.cursors.after;
          } else {
            moreDataAvailable = false;
          }
        } else {
          console.error('Unexpected response structure:', data);
          moreDataAvailable = false;
        }
      }
  
      return allArtists;
    } catch (error) {
      console.error('Error fetching followed artists:', error);
      throw error;
    }
  };

export default fetchAllFollowedArtists;