import React, { useEffect, useState } from 'react';
import { grid } from 'ldrs'
import pLimit from 'p-limit';

import fetchWithRetry from './utils/fetchWithRetry';
import fetchAllFollowedArtists from './utils/fetchAllFollowedArtist';
import fetchArtistDiscography from './utils/fetchArtistDiscography';

import { fetchUser, authenticateUser, setToken, getToken } from './api/spotify';

grid.register();

const App = () => {
  const [recentReleases, setRecentReleases] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [user, setUser] = useState(null);

  const year = new Date().getFullYear();
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (getToken()) {
      alert('test');
      fetchUser()
        .then((data) => setUser(data))
        .catch((err) => alert(err));
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const token = hash.split('&')[0].split('=')[1];
      if (token) {
        setToken(token);
        alert(getToken());
      }
      window.location.hash = '';
    }
  }, []);

  const callback = (data) => {
    setRecentReleases(data);
    setLoading(false);
    setSearched(true);
  }

  const fetchRecentReleases = async (fn) => {
    setLoading(true);
    const artists = await fetchAllFollowedArtists();
  
    const batchSize = 25; // Number of artists per batch
    const concurrencyLimit = 2; // Number of concurrent requests within a batch
    const limit = pLimit(concurrencyLimit);
  
    const allReleases = [];
  
    for (let i = 0; i < artists.length; i += batchSize) {
      const batch = artists.slice(i, i + batchSize);
  
      // Fetch releases for the current batch with limited concurrency and retry logic
      const batchReleases = await Promise.all(
        batch.map(artist =>
          limit(async () => {
            try {
              const releases = await fetchWithRetry(() => fetchArtistDiscography(artist.id), 2000);
              setLoadingMessage(`Fetching ${artist.name}'s albums and singles`);
              return releases;
            } catch (error) {
              console.error(`Failed to fetch releases for ${artist.name}:`, error);
              return []; // Return an empty array if all retries fail
            }
          })
        )
      );
  
      // Flatten and store results for this batch
      allReleases.push(...batchReleases.flat());
  
      // Optional: Add delay between batches to stay under rate limits
      if (i + batchSize < artists.length) {
        await delay(2000); // Adjust the delay time (in ms) as per your API's rate limits
      }
    }
  
    // Sort all releases by release date
    allReleases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  
    fn(allReleases);
  };
  
  return (
    <div className='w-full flex flex-col'>

      <div className='relative w-full h-[256px] bg-[#1DB954] flex justify-center mb-20 shadow-xl'>
        <div className='p-2'>
          <p className='libre-baskerville font-bold md:text-[96px] text-[38px] text-center text-[#191414] h-fit md:mt-6 mt-10'>whatsnewfeed</p>
          <p className='text-center md:text-xl text-base text-wrap'>View your latest releases from artists you followed in spotify with a larger cap.</p>
        </div>

        {!getToken()
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
            <div className={`inline-flex gap-2 items-center p-2 ${getToken() ? 'block' : 'hidden'}`}>
              <img src={user?.images[0].url} alt="user_profile" className='w-12 h-12 rounded-full' />
              <p className='mr-2 text-xl'>{user?.display_name}</p>
            </div>

            <button
              className={`px-8 text-xl duration-200 hover:scale-110 ${loading ? '' : ''}`}
              onClick={()=>fetchRecentReleases(callback)} disabled={loading ? true : false}
            >
              Search
            </button>
          </div>
        }
      </div>

      <div className=' flex flex-col items-center w-full min-h-screen'>
        <div className={`flex flex-col items-center ${loading ? 'mt-20' : 'm-0'}`}>
          {loading && <l-grid size="96" speed="1.5" color="white" />}
          <p>
            {loading && loadingMessage}
          </p>
        </div>
        {recentReleases.length === 0 && getToken() && searched ? (
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
            <p className='text-sm'>&copy;  {year} whatsnewfeed - All Rights Reserved.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;