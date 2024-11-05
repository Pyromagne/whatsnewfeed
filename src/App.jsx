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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      if (accessToken) {
        try {
          const userData = await fetchUser(accessToken);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    getUser();

  }, [accessToken]);

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

  const fetchRecentReleases = async () => {
    setLoading(true);
    const artists = await fetchFollowedArtists(accessToken);
    const allReleases = [];

    for (const artist of artists) {
      const releases = await fetchArtistDiscography(accessToken, artist.id);
      setLoadingMessage(`fetching ${artist.name}'s albums and singles`);
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
          <p className='libre-baskerville font-bold md:text-[96px] text-[38px] text-center text-[#191414] h-fit md:mt-6 mt-10'>whatsnewfeed</p>
          <p className='text-center md:text-xl text-base text-wrap'>View your latest releases from artists you followed in spotify with a larger cap.</p>
        </div>

        {!accessToken
          ? <button className={`
              absolute md:-bottom-10 -bottom-8 rounded-full bg-[#191414] md:py-4 py-2 px-8 text-2xl border border-[#393939]  duration-200
              hover:shadow-xl hover:scale-105
            `} onClick={authenticateUser}
          >
            Log in
          </button>
          :
          <div className={`
              absolute flex gap-4 -bottom-8 shadow-lg rounded-full border border-[#393939] bg-[#191414]
              md:ml-8 md:-bottom-10 md:left-0
          `}>
            <div className={`inline-flex gap-2 items-center p-2 ${accessToken ? 'block' : 'hidden'}`}>
              <img src={user?.images[0].url} alt="user_profile" className='w-12 h-12 rounded-full' />
              <p className='mr-2 text-xl'>{user?.display_name}</p>
            </div>

            <button
              className={`px-8 text-xl duration-200 hover:scale-110 ${loading ? '' : ''}`}
              onClick={fetchRecentReleases} disabled={loading ? true : false}
            >
              Search
            </button>
          </div>
        }
      </div>

      <div className=' flex flex-col items-center w-full min-h-[512px]'>
        <div className={`flex flex-col items-center ${loading ? 'mt-20' : 'm-0'}`}>
          {loading && <l-grid size="96" speed="1.5" color="white" />}
          <p>
            {loading && loadingMessage}
          </p>
        </div>
        {recentReleases.length === 0 && accessToken && searched ? (
          <p className='text-center text-3xl'>No recent releases found.</p>
        ) : (
          <div className='flex flex-col items-center md:w-3/4 w-full'>
            {recentReleases.map(release => (
              <div key={release.id} className='flex gap-4 md:w-3/4 w-4/5 p-4 m-4 border border-[#f0f8ff] rounded-lg bg-[#191414] h-32 overflow-hidden'>
                <img src={release.images[0].url} alt={release.name} className='md:w-24 rounded-md' />
                <div className='flex flex-col w-full'>
                  <p className='capitalize'>{release.album_type}</p>

                  <a href={release.external_urls.spotify} rel="noopener noreferrer" target='_blank'
                    className='hover:text-[#1DB954] text-ellipsis overflow-hidden w-full'
                  >
                    {release.name}
                  </a>

                  <a href={release.artists[0].external_urls.spotify} rel="noopener noreferrer" target='_blank'
                    className='hover:text-[#1DB954]'
                  >
                    {release.artists[0].name}
                  </a>
                  <p>{release.release_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='flex flex-col w-full h-fit bg-[#191414] border-t border-t-[#393939] shadow-xl overflow-hidden p-4 pt-8'>
        <div className='flex'>
          <div>
            <p className='text-sm'>Created by <a href="https://github.com/Pyromagne" className='font-semibold hover:text-[#1DB954]'>Pyromagne</a></p>
            <a href="https://github.com/Pyromagne/whatsnewfeed" className='font-semibold text-sm hover:text-[#1DB954]'>Source Code</a>
          </div>
          <div className='ml-auto flex flex-col items-end'>
            <p className='text-sm'>Powered by the <a href="https://developer.spotify.com/" className='text-[#1DB954]'>Spotify API</a>, served by <a href="https://render.com/" className='text-[#1DB954]'>Render</a></p>
            <p className='text-sm'>&copy;  2024 whatsnewfeed - All Rights Reserved.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;

const authenticateUser = () => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=token&show_dialog=true`;
  window.location.href = authUrl;
};

const fetchUser = async (accessToken) => {
  const url = `https://api.spotify.com/v1/me`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const user = await response.json();
  return user;
};

const fetchFollowedArtists = async (accessToken) => {
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

const fetchArtistDiscography = async (accessToken, artistId) => {
  const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`;

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