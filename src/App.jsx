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

  const authenticateUser = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
  };

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
  };

  const fetchFirstFiveReleasesForArtist = async (artistId) => {
    const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=10`;

    const artistResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const artistAlbums = await artistResponse.json();

    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

    const recentAlbums = artistAlbums.items.filter(album => {

      const releaseDate = new Date(album.release_date);

      return !isNaN(releaseDate) && releaseDate >= threeMonthsAgo;
    });

    return recentAlbums;
  };


  const fetchRecentReleases = async () => {
    setLoading(true);
    const artists = await fetchFollowedArtists();
    const allReleases = [];

    for (const artist of artists) {
      const releases = await fetchFirstFiveReleasesForArtist(artist.id);
      allReleases.push(...releases);
    }

    allReleases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

    setLoading(false);
    setRecentReleases(allReleases);
    setSearched(true);
  };

  return (
    <div className='w-full flex flex-col'>
      <div className='relative w-full h-[256px] bg-[#1DB954] flex justify-center mb-20 shadow-xl'>
        <div className='p-2'>
          <p className='libre-baskerville font-bold md:text-[96px] text-[48px] text-center text-[#191414] h-fit md:mt-6 mt-10'>whatsnewfeed</p>
          <p className='text-center md:text-xl text-base text-wrap'>View your latest releases from artists you follow with a larger cap.</p>
        </div>
        {!accessToken
          ? <button
            className={`
              absolute md:-bottom-10 -bottom-8 rounded-full bg-[#191414] md:py-4 py-2 px-8 text-2xl border border-[#393939]  duration-200
              hover:shadow-xl hover:scale-105
            `} onClick={authenticateUser}
          >
            Login with Spotify
          </button>
          : <button
            className={`absolute md:-bottom-10 -bottom-8 rounded-full bg-[#191414] md:py-4 py-2 px-8 text-2xl border border-[#393939] duration-200
              hover:shadow-xl hover:scale-105
            `}
            onClick={fetchRecentReleases} disabled={loading ? true : false}
          >
            Search
          </button>
        }
      </div>

      <div className='flex flex-col items-center w-full min-h-[512px]'>
        <div className={`${loading ? 'mt-20' : 'm-0'}`}>
          {loading && <l-grid size="96" speed="1.5" color="white" />}
        </div>
        {recentReleases.length === 0 && accessToken && searched ? (
          <p className='text-center text-3xl'>No recent releases found.</p>
        ) : (
          <div className='flex flex-col items-center w-3/4'>
            {recentReleases.map(release => (
              <div key={release.id} className='flex gap-4 w-3/4 p-4 m-4 border border-[#f0f8ff] rounded-lg bg-[#191414] h-32'>
                <div className='w-24 bg-cover bg-no-repeat rounded-md' style={{ backgroundImage: `url(${release.images[0].url})` }}>
                </div>
                <div className='flex flex-col'>
                  <p className='capitalize'>{release.album_type}</p>
                  <a href={release.external_urls.spotify} rel="noopener noreferrer" target='_blank'>
                    {release.name}
                  </a>
                  <a href={release.artists[0].external_urls.spotify} rel="noopener noreferrer" target='_blank'>{release.artists[0].name}</a>
                  <p>{release.release_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='flex flex-col w-full h-20 bg-[#191414] border-t border-t-[#393939] shadow-xl overflow-hidden px-4 py-2'>
        <div className='flex'>
          <div className='w-fit'>
            <p className='text-2xl font-semibold'>whatsnewfeed</p>
          </div>
          <div className='ml-auto flex flex-col items-end'>
            <p>Created by <a href="https://github.com/Pyromagne" className='font-semibold hover:text-[#1DB954]'>Pyromagne</a></p>
            <a href="https://github.com/Pyromagne/whatsnewfeed" className='font-semibold hover:text-[#1DB954]'>Source Code</a>
          </div>
        </div>
        <p className='mt-auto text-sm'>Powered by the <a href="https://developer.spotify.com/" className='text-[#1DB954]'>Spotify API</a>, served by <a href="https://render.com/" className='text-[#1DB954]'>Render</a></p>
      </div>
    </div>
  );
};

export default App;
