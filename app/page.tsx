// pages/index.js
"use client"
import Head from 'next/head';
import Chat from './components/chat/Chat';

export default function Home() {
  return (
    <div>
      <Head>
        <title>GPT-3.5 Turbo Chat</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Chat />
    </div>
  );
}
