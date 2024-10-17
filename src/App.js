import React, { useEffect, useState } from 'react';
import { grid } from 'ldrs'

grid.register();

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
const SCOPES = process.env.REACT_APP_SCOPES;

const App = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [recentReleases, setRecentReleases] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const authenticateUser = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const token = hash.split('&')[0].split('=')[1];
      if (token) {
        setAccessToken(token);
      }
      window.location.hash = '';
    }
  }, []);

  const fetchFollowedArtists = async () => {
    if (!accessToken) return;

    let allArtists = [];
    let nextCursor = null;
    let moreDataAvailable = true;

    while (moreDataAvailable) {
      const url = nextCursor
        ? `https://api.spotify.com/v1/me/following?type=artist&limit=50&after=${nextCursor}`
        : `https://api.spotify.com/v1/me/following?type=artist&limit=50`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      // Log the current state
      console.log(`Fetched artists: ${data.artists.items.length}, Next Cursor: ${data.artists.cursors.after}`);

      if (data.artists && data.artists.items) {
        allArtists.push(...data.artists.items);

        // Check if there is a next cursor
        if (data.artists.cursors && data.artists.cursors.after) {
          nextCursor = data.artists.cursors.after; // Update to the next cursor
        } else {
          moreDataAvailable = false; // No more data to fetch
        }
      } else {
        console.error('Unexpected response structure:', data);
        moreDataAvailable = false; // Exit loop if the structure is not as expected
      }
    }

    return allArtists;
  };



  const fetchAllReleasesForArtist = async (artistId) => {
    let allReleases = [];
    let nextUrl = null;  // URL for the next page of results
    let moreDataAvailable = true;

    while (moreDataAvailable) {
      // Use the nextUrl for pagination if it exists; otherwise, build the initial URL
      const url = nextUrl
        ? nextUrl
        : `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`;

      const artistResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const artistAlbums = await artistResponse.json();

      const recent = artistAlbums.items.filter(release => new Date(release.release_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      allReleases.push(...recent);

      // Check if there is a next URL for more items to fetch
      if (artistAlbums.next) {
        nextUrl = artistAlbums.next;  // Update to the next URL
      } else {
        moreDataAvailable = false; // No more data to fetch
      }
    }

    return allReleases;
  };


  const fetchRecentReleases = async () => {
    setLoading(true);
    const artists = await fetchFollowedArtists();
    const allReleases = [];

    // Fetch releases for each followed artist
    for (const artist of artists) {
      const releases = await fetchAllReleasesForArtist(artist.id);
      allReleases.push(...releases);
    }

    // Sort releases by release_date from most recent to least recent
    allReleases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

    setLoading(false);
    setRecentReleases(allReleases);
    setSearched(true);
  };


  useEffect(() => {
    if (accessToken) {
      /* fetchRecentReleases(); */
    }
  }, [accessToken]);

  return (
    <div>
      <div className='relative w-full h-[256px] bg-[#1DB954] flex justify-center mb-20'>
        <p className='libre-baskerville font-bold text-[96px] text-center text-[#191414] h-fit mt-6'>whatsnewfeed</p>
        {!accessToken
          ? <button className='absolute -bottom-10 rounded-full bg-[#191414] py-4 px-8 text-5xl border border-[#393939] w-[512px] ' onClick={authenticateUser}>Login with Spotify</button>
          : <button className='absolute -bottom-10 rounded-full bg-[#191414] py-4 px-8 text-5xl border border-[#393939] w-[512px] ' onClick={fetchRecentReleases} disabled={loading ? true : false}>Search</button>
        }
      </div>
      <div className='flex flex-col items-center w-full'>
        <div className={`${loading ? 'mt-20' : 'm-0'}`}>
          {loading && <l-grid size="96" speed="1.5" color="white" />}
        </div>
        {recentReleases.length === 0 && accessToken && searched ? (
          <p className='text-center text-3xl'>No recent releases found.</p>
        ) : (
          <div className='flex flex-col items-center'>
            {recentReleases.map(release => (
              <div key={release.id} className='flex w-3/4 p-4 m-4 border border-[#f0f8ff] rounded-lg bg-[#191414]'>
                <img src={release.images[0].url} alt={release.name} className='w-20 rounded-md' />
                <div className='flex flex-col'>
                  <p className='capitalize'>{release.album_type}</p>
                  <p>
                    {release.name} by {release.artists[0].name} (Released on {release.release_date})
                  </p>
                  <a href={release.external_urls.spotify} target='_blank'>
                    {release.name}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
