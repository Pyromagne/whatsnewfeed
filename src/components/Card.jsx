import React from "react";
import { useStateContext } from "../context/stateContext";

const Card = ({ data = {} }) => {
  const { isURI } = useStateContext();

  return (
    <div id={data.id} className='flex gap-4 w-full p-4 m-4 border border-[#f0f8ff] rounded-lg bg-[#191414] h-32 overflow-hidden'>
      <img src={data.images[0].url} alt={data.name} className='md:w-24 rounded-md' />
      <div className='flex flex-col w-full'>
        <p className='capitalize'>{data.album_type}</p>

        <a href={isURI ? data.uri : data.external_urls.spotify} rel="noopener noreferrer" target='_blank'
          className='hover:text-[#1DB954] text-ellipsis overflow-hidden w-full'
        >
          {data.name}
        </a>

        <a href={isURI ? data.uri : data.artists[0].external_urls.spotify} rel="noopener noreferrer" target='_blank'
          className='hover:text-[#1DB954]'
        >
          {data.artists[0].name}
        </a>
        <p>{data.release_date}</p>
      </div>
    </div>
  )
}

export default Card;