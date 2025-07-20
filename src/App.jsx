import { useEffect, useState } from 'react';
import { grid } from 'ldrs'
import pLimit from 'p-limit';
import { TiThMenuOutline, TiThList  } from "react-icons/ti";


import fetchWithRetry from './utils/fetchWithRetry';
import fetchAllFollowedArtists from './utils/fetchAllFollowedArtist';
import fetchArtistDiscography from './utils/fetchArtistDiscography';

import Card from './components/Card';
import Grid from './components/Grid';


import { useStateContext } from './context/stateContext';
import { fetchUser, authenticateUser, setToken, getToken } from './api/spotify';

grid.register();

const App = () => {
  const { isGrid, setIsGrid, recentReleases, setRecentReleases } = useStateContext();
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [user, setUser] = useState(null);

  const year = new Date().getFullYear();
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const hash = window.location.hash;
  
    if (hash) {
      const token = hash.split('&')[0].split('=')[1];
      if (token) {
        setToken(token);
        fetchUser()
          .then((data) => setUser(data))
          .catch((err) => alert(err));
      }
      window.location.hash = '';
    } else if (getToken()) {
      fetchUser()
        .then((data) => setUser(data))
        .catch((err) => alert(err));
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

      <div className={`relative w-full h-[256px] bg-[#1DB954] flex justify-center shadow-xl`}>
        <div className='p-2'>
          <p className='libre-baskerville font-bold md:text-7xl text-[38px] text-center text-[#191414] h-fit md:mt-20 mt-16'>whats<span className='libre-baskerville'>new</span>feed</p>
          <p className='text-center md:text-lg text-sm text-wrap'>View your latest releases from artists you followed in spotify with a larger cap.</p>
        </div>

        <button className={`absolute top-4 left-4 ${getToken() ? 'block' : 'hidden'}`} onClick={()=>setIsGrid(!isGrid)}>
          {isGrid ? <TiThMenuOutline title='Card' size={20} /> : <TiThList title='List' size={20} />}
        </button>

        {!getToken()
          ? <button className={`
              absolute md:-bottom-8 -bottom-6 rounded-full bg-[#191414] md:py-4 py-2 px-8 text-xl border border-[#393939] hover:border-[#1DB954]  duration-200
              hover:shadow-xl hover:text-[#1DB954]
            `} onClick={authenticateUser}
          >
            Log in
          </button>
          :
          <div className={`
              absolute flex gap-4 -bottom-8 shadow-lg rounded-full border border-[#393939] bg-[#191414]
              md:ml-6 md:-bottom-8 md:left-0
          `}>
            <div className={`inline-flex gap-2 items-center p-2 ${getToken() ? 'block' : 'hidden'}`}>
              <img src={user?.images[0].url} alt="user_profile" className='w-12 h-12 rounded-full object-cover  ' />
              <p className='mr-2'>{user?.display_name}</p>
            </div>

            <button
              className={`px-8 duration-200 hover:scale-110 ${loading ? '' : ''}`}
              onClick={()=>fetchRecentReleases(callback)} disabled={loading ? true : false}
            >
              Search
            </button>
          </div>
        }
      </div>

      <main className=' flex flex-col items-center w-full min-h-svh pattern'>
        <div className={`flex flex-col items-center ${loading ? 'mt-20' : 'm-0'}`}>
          {loading && <l-grid size="96" speed="1.5" color="white" />}
          <p>
            {loading && loadingMessage}
          </p>
        </div>
        {recentReleases.length === 0 && getToken() && searched ? (
          <p className='text-center text-3xl'>No recent releases found.</p>
          ) : ( 
            isGrid ? 
            (
              recentReleases.length === 0 ? null : <Grid data={recentReleases} className='w-full h-svh mt-20' />
            ) : (
              <div className='flex flex-col items-center md:w-3/4 w-full mt-20'>
              {recentReleases.map((data, index) => (
                <Card data={data} key={index}/>
              ))}
              </div>
            )
          )
        }
      </main>

      <footer className='flex flex-col w-full bg-[#191414] border-t border-t-[#393939] shadow-xl overflow-hidden p-4 pt-8'>
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
      </footer>
    </div>
  );
};

export default App;