import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { FaXmark } from "react-icons/fa6";
import { IoCardOutline, IoFingerPrintOutline } from 'react-icons/io5';
import { FaArrowUp, FaCheckCircle, FaIdBadge } from 'react-icons/fa';
import { TbFingerprintScan, TbUserCheck } from "react-icons/tb";
import { LuSmartphoneNfc } from "react-icons/lu";
import { useRouter } from 'next/router';

export default function Card() {

  const [request, setRequest] = useState();
  const [locked, setLocked] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scannedUser, setScannedUser] = useState(null)
  const router = useRouter();

  useEffect(function () {
    window.ipc.on("match_request", (data) => {
      if (data.credential_type === "card") {
        setRequest(data);
      }
    })
    window.ipc.send("check_requests", {})
    window.ipc.send("start_card_scan", {})
    window.ipc.on("card_scanned", async function (data) {
      setScannedUser(data)
      if (!data.request) {
        setRequest(null)
      }
      setLocked(true)
      setScanned(true)
      setTimeout(function () {
        if(data.request){
          router.push("/home")
        } else {
          router.push("/dash")
        }
      }, 2500)
    })
    window.ipc.on("aborted", (data) => {
      setLocked(true)
      setRequest(null)
      setTimeout(function () {
        router.push("/home")
      }, 5000)
    })
  }, [])

  function abort() {
    if (request) {
      window.ipc.send("cancel_request", request)
      setLocked(true)
      setRequest(null)
      setTimeout(function () {
        router.push("/home")
      }, 5000)
    } else {
      router.push("/home")
    }
  }

  return (
    <React.Fragment>
      <Head>
        <title>RW GateKeeper - Gate IoT Service</title>
      </Head>
      <div className={`w-full h-full ${scanned ? 'bg-green-600' : 'bg-black'} flex flex-col pb-20`}>
        <div className="flex flex-row mt-3 mx-5 pb-2 border-b-2 border-gray-300">
          <img
            className="h-12"
            src="/images/LogoDark.png"
            alt="Logo image"
          />
          <p className="text-2xl font-semibold text-white my-auto ml-4">{scanned ? `${scannedUser.label} scanned successfully.` : 'Please scan your badge.'}</p>
        </div>

        {request &&
          <div className="rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
            <div className="flex flex-col">
              <p className="text-xl font-extrabold">{request.user.first_name} {request.user.last_name}</p>
              <p className="text-xl">Please hold <b>{request.label}</b> near the reader.</p>
            </div>
            <LuSmartphoneNfc className="w-12 h-12 my-auto ml-auto text-rams" />
          </div>
        }

        {(scannedUser && !scannedUser.request) &&
          <div className="rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
            <div className="flex flex-col">
              <p className="text-md font-normal">{scannedUser.position_name}</p>
              <p className="text-xl font-extrabold">{scannedUser.first_name} {scannedUser.last_name}</p>
              <p className="text-xl font-normal">{scannedUser.member_id} {scannedUser.request ? 'registered successfully.' : 'authenticated successfully.'}</p>
            </div>
            <TbUserCheck className="w-12 h-12 my-auto ml-auto text-rams" />
          </div>
        }

        <div className="flex flex-row m-auto">
          <FaIdBadge className="w-32 h-32 text-rams" />
          {locked ? (scanned ? <FaCheckCircle className="w-16 h-16 text-white my-auto" /> : <FaXmark className="w-16 h-16 text-red-600 my-auto" />) : <FaArrowUp className="w-16 h-16 text-white my-auto animate-bounce" />}
        </div>

        {!locked && <div onClick={abort} className="border-2 border-neutral-900 hover:border-rams hover:bg-neutral-800 cursor-pointer rounded-xl mx-5 mt-5 bg-neutral-900 flex flex-row text-white py-4 px-8">
          <div className="flex flex-col">
            <p className="text-xl font-extrabold">Cancel Attempt</p>
            <p className="text-xl">Decline the authorisation request.</p>
          </div>
          <FaXmark className="w-12 h-12 my-auto ml-auto text-rams" />
        </div>}
      </div>
    </React.Fragment>
  )
}
