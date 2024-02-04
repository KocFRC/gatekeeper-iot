import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { IoFingerPrintOutline } from "react-icons/io5";
import { IoNotifications } from "react-icons/io5";
import { FaIdBadge } from "react-icons/fa";
import { BiNotification } from "react-icons/bi";
import { useRouter } from 'next/router';
import { Client } from "appwrite";

export default function HomePage() {

  const router = useRouter();
  const [authMode, setAuthMode] = useState(null)

  useEffect(function () {
    const client = new Client()
      .setEndpoint('https://is.rams7729.org/v1')
      .setProject('gatekeeper');
    client.subscribe(['databases.security_profiles.collections.match_requests.documents'], response => {
      window.ipc.send("check_requests", {})
    });
    window.ipc.on("match_request", (data) => {
      if (data.credential_type === "fingerprint") {
        router.push("/fingerprint")
      }
      if (data.credential_type === "card") {
        router.push("/card")
      }
    })
    window.ipc.send("check_requests", {})
    window.ipc.send("getAuthMode", {})
    window.ipc.on("authMode", (data) => {
      setAuthMode(data)
    })
  }, [])

  return (
    <React.Fragment>
      <Head>
        <title>RW GateKeeper - Gate IoT Service</title>
      </Head>
      <div className="w-full h-full bg-black flex flex-col pb-20">
        <div className="flex flex-row mt-3 mx-5 pb-2 border-b-2 border-gray-300">
          <img
            className="h-12"
            src="/images/LogoDark.png"
            alt="Logo image"
          />
          <p className="text-2xl font-semibold text-white my-auto ml-4">Welcome to the Workshop.</p>
        </div>

        {authMode === "unlocked" && <div className="w-full bg-green-600 font-bold text-center text-white text-4xl my-auto py-5">
          Club in Session
          <p className="text-2xl font-medium">All members may authenticate.</p>
        </div>}

        {authMode === "authenticate" && <div className="w-full bg-rams font-bold text-center text-yellow text-4xl my-auto py-5">
          Permission Required
          <p className="text-2xl font-medium">Only leadership team members may authenticate.</p>
        </div>}

        {authMode === "locked" && <div className="w-full bg-red-900 font-bold text-center text-white text-4xl my-auto py-5">
          Locked
          <p className="text-2xl font-medium">Entry is not permitted.</p>
        </div>}

        <Link href={"/fingerprint"}>
          <div className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
            <div className="flex flex-col">
              <p className="text-xl font-extrabold">Authenticate with a Fingerprint</p>
              <p className="text-xl">Scan your finger to unlock the door. </p>
            </div>
            <IoFingerPrintOutline className="w-12 h-12 my-auto ml-auto text-rams" />
          </div>
        </Link>
        <Link href={"/card"}>
          <div className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
            <div className="flex flex-col">
              <p className="text-xl font-extrabold">Authenticate with a Card</p>
              <p className="text-xl">Hold your team badge near the Card reader.</p>
            </div>
            <FaIdBadge className="w-12 h-12 my-auto ml-auto text-rams" />
          </div>
        </Link>
        <div className="opacity-50 border-2 border-red-300 rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Call the Inside</p>
            <p className="text-xl">Send a notification to the inside to approve.</p>
          </div>
          <IoNotifications className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>
        <div className="opacity-50 border-2 border-red-300 rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Request Permission</p>
            <p className="text-xl">Create an online authentication request.</p>
          </div>
          <BiNotification className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>
      </div>
    </React.Fragment >
  )
}
