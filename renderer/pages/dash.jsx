import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { IoFingerPrintOutline } from "react-icons/io5";
import { IoNotifications } from "react-icons/io5";
import { FaArrowUp, FaIdBadge, FaLock, FaUnlock, FaUserCheck } from "react-icons/fa";
import { BiNotification } from "react-icons/bi";
import { useRouter } from 'next/router';
import { Client } from "appwrite";
import { FaXmark } from 'react-icons/fa6';

export default function DashPage() {

  const router = useRouter();
  const [user,setUser] = useState(null)
  const [authMode,setAuthMode] = useState(null)

  useEffect(function () {
    window.ipc.send("getAuthUser", {})
    window.ipc.on("authUser", (data) => {
      setUser(data)
      console.log(data)
    })
    window.ipc.send("getAuthMode", {})
    window.ipc.on("authMode", (data) => {
      setAuthMode(data)
    })
  }, [])

  function abort() {
    window.ipc.send("abort", null)
    router.push("/home")
  }

  function alterAuthMode(mode){
    setAuthMode(mode);
    window.ipc.send("setAuthMode", mode)
  }

  function unlock(){
    window.ipc.send("unlock", null)
    router.push("/home")
  }

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
          <p className="text-2xl font-semibold text-white my-auto ml-4">Please choose an action.</p>
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

        {(authMode === "unlocked" || (user && user.gate_role === "wildcard") || (user && user.gate_role == "leadership" && authMode === "authenticate")) && <div onClick={unlock} className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Enter the Workshop</p>
            <p className="text-xl">You will be able to enter the Workshop.</p>
          </div>
          <FaArrowUp className="animate-bounce w-12 h-12 my-auto ml-auto text-rams" />
        </div>}
        {user && user.gate_role === "wildcard" && authMode !== "locked" && <div onClick={() => alterAuthMode("locked")} className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Lock the Gate</p>
            <p className="text-xl">The gate will be in locked mode.</p>
          </div>
          <FaLock className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>}
        {user && user.gate_role === "wildcard" && authMode !== "unlocked" && <div onClick={() => alterAuthMode("unlocked")} className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Unlock the Gate</p>
            <p className="text-xl">The gate will be in unlocked mode.</p>
          </div>
          <FaUnlock className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>}
        {user && user.gate_role === "wildcard" && authMode !== "authenticate" && <div onClick={() => alterAuthMode("authenticate")} className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Authenticate Mode</p>
            <p className="text-xl">Only Leadership will be able to enter.</p>
          </div>
          <FaUserCheck className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>}
        <div onClick={abort} className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Deuthenticate Your Session</p>
            <p className="text-xl">This authentication attempt will be cancelled.</p>
          </div>
          <FaXmark className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>
      </div>
    </React.Fragment>
  )
}
