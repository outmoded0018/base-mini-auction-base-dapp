"use client";

import {
  Gavel,
  Loader2,
  ShieldCheck,
  TimerReset,
  Trophy,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_ITEM_NAME_LENGTH,
  MAX_ITEM_NOTE_LENGTH,
  miniAuctionAbi,
  miniAuctionContractAddress,
} from "@/lib/mini-auction";

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEth(value?: bigint) {
  if (value === undefined) return "--";
  return `${Number(formatEther(value)).toFixed(4)} ETH`;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_BI = BigInt(0);

function timeLeftLabel(endsAt?: bigint) {
  if (!endsAt) return "--";
  const seconds = Number(endsAt) - Math.floor(new Date().getTime() / 1000);
  if (seconds <= 0) return "Ended";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function MiniAuctionApp() {
  const [auctionIdInput, setAuctionIdInput] = useState("1");
  const [itemName, setItemName] = useState("Base launch poster");
  const [itemNote, setItemNote] = useState(
    "A one-day mini auction with a clear mobile bidding flow.",
  );
  const [startingBidEth, setStartingBidEth] = useState("0.002");
  const [durationHours, setDurationHours] = useState("12");
  const [bidEth, setBidEth] = useState("0.003");
  const [status, setStatus] = useState(
    "List a small item, place bids on Base, and settle cleanly when the timer ends.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );
  const parsedAuctionId = BigInt(Math.max(1, Number(auctionIdInput || "1")));

  const auctionQuery = useReadContract({
    abi: miniAuctionAbi,
    address: miniAuctionContractAddress,
    functionName: "getAuction",
    args: [parsedAuctionId],
    query: {
      enabled: Boolean(miniAuctionContractAddress),
      refetchInterval: 12000,
    },
  });

  const auctionTuple = auctionQuery.data as
    | readonly [Address, bigint, bigint, Address, bigint, boolean, string, string]
    | undefined;

  const auction = useMemo(
    () =>
      auctionTuple
        ? {
            seller: auctionTuple[0],
            startingBid: auctionTuple[1],
            highestBid: auctionTuple[2],
            highestBidder: auctionTuple[3],
            endsAt: auctionTuple[4],
            settled: auctionTuple[5],
            itemName: auctionTuple[6],
            itemNote: auctionTuple[7],
          }
        : undefined,
    [auctionTuple],
  );

  const currentBid = useMemo(() => {
    if (!auction) return undefined;
    return auction.highestBid > ZERO_BI ? auction.highestBid : auction.startingBid;
  }, [auction]);

  const canCreate =
    Boolean(miniAuctionContractAddress) &&
    isConnected &&
    chainId === base.id &&
    itemName.trim().length > 0 &&
    itemName.trim().length <= MAX_ITEM_NAME_LENGTH &&
    itemNote.trim().length <= MAX_ITEM_NOTE_LENGTH &&
    Number(startingBidEth) > 0 &&
    Number(durationHours) > 0;

  const nowSeconds = Math.floor(new Date().getTime() / 1000);
  const isAuctionActive = auction ? Number(auction.endsAt) > nowSeconds : false;

  const canBid =
    Boolean(miniAuctionContractAddress) &&
    isConnected &&
    chainId === base.id &&
    Boolean(auction?.seller && auction.seller !== ZERO_ADDRESS) &&
    !auction?.settled &&
    isAuctionActive &&
    Number(bidEth) > 0;

  const canSettle =
    Boolean(miniAuctionContractAddress) &&
    isConnected &&
    chainId === base.id &&
    Boolean(auction?.seller && auction.seller !== ZERO_ADDRESS) &&
    !auction?.settled &&
    !isAuctionActive;

  const statusText = confirmed
    ? "Transaction confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function createAuction() {
    if (!miniAuctionContractAddress) return;

    try {
      const startingBid = parseEther(startingBidEth);
      const durationSeconds = BigInt(Math.floor(Number(durationHours) * 3600));
      setStatus("Confirm the auction creation in your wallet.");
      writeContract({
        address: miniAuctionContractAddress,
        abi: miniAuctionAbi,
        functionName: "createAuction",
        args: [itemName.trim(), itemNote.trim(), startingBid, durationSeconds],
        chainId: base.id,
      });
    } catch {
      setStatus("Enter a valid starting bid before creating the auction.");
    }
  }

  function placeBid() {
    if (!miniAuctionContractAddress) return;

    try {
      const value = parseEther(bidEth);
      setStatus("Confirm your bid in the wallet.");
      writeContract({
        address: miniAuctionContractAddress,
        abi: miniAuctionAbi,
        functionName: "placeBid",
        args: [parsedAuctionId],
        chainId: base.id,
        value,
      });
    } catch {
      setStatus("Enter a valid bid amount before placing a bid.");
    }
  }

  function settleAuction() {
    if (!miniAuctionContractAddress) return;

    setStatus("Confirm auction settlement in your wallet.");
    writeContract({
      address: miniAuctionContractAddress,
      abi: miniAuctionAbi,
      functionName: "settleAuction",
      args: [parsedAuctionId],
      chainId: base.id,
    });
  }

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#0d1016] text-[#f4f7fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[14px] border border-[#62c5ff] bg-[#132130] shadow-[0_0_32px_rgba(98,197,255,0.18)]">
              <Gavel className="h-5 w-5 text-[#62c5ff]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#62c5ff]">
                Base Mini Auction
              </p>
              <h1 className="text-xl font-black sm:text-2xl">
                List small items. Bid live on Base.
              </h1>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold">
                {shortAddress(address)}
              </span>
              <button
                className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-[#0d1016] disabled:opacity-60"
                disabled={disconnecting}
                onClick={disconnectWallet}
              >
                {disconnecting ? "Disconnecting" : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#62c5ff] bg-[#62c5ff] px-4 py-2 text-sm font-semibold text-[#041018] disabled:opacity-60"
              disabled={availableConnectors.length === 0 || connecting}
              onClick={connectWallet}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect
            </button>
          )}
          {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold text-[#9bd7ff]">
              {walletStatus}
            </p>
          ) : null}
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1.02fr)_420px]">
          <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,#16304a_0%,#0f1723_40%,#0b0f16_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Onchain bidding
              </p>
              <h2 className="text-4xl font-black leading-tight sm:text-6xl">
                A compact auction board built for Base mobile flows.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#b1c3d6] sm:text-lg">
                Create a listing, watch the live high bid update, and settle
                once the timer ends. The whole flow stays legible on a phone.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#2f4258] bg-[#111a25] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                  Step 1
                </p>
                <p className="mt-2 text-lg font-semibold">Create listing</p>
              </div>
              <div className="rounded-[22px] border border-[#2f4258] bg-[#111a25] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                  Step 2
                </p>
                <p className="mt-2 text-lg font-semibold">Place live bids</p>
              </div>
              <div className="rounded-[22px] border border-[#2f4258] bg-[#111a25] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                  Step 3
                </p>
                <p className="mt-2 text-lg font-semibold">Settle winner</p>
              </div>
            </div>

            <div className="mt-8 rounded-[30px] border border-[#213246] bg-[#09111a] p-5">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                    Live board
                  </p>
                  <h3 className="mt-2 text-3xl font-black">
                    {auction?.itemName || "Base launch poster"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#9fb2c7]">
                    {auction?.itemNote || "Short-form auction with a mobile-first bid flow."}
                  </p>
                </div>
                <div className="rounded-full border border-[#213246] bg-[#101b28] px-4 py-2 text-sm font-semibold text-[#9fdcff]">
                  {auction ? timeLeftLabel(auction.endsAt) : "Waiting for listing"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] border border-[#213246] bg-[#101822] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#78d7ff]">
                    Current bid
                  </p>
                  <p className="mt-3 text-2xl font-black">{formatEth(currentBid)}</p>
                </div>
                <div className="rounded-[22px] border border-[#213246] bg-[#101822] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#78d7ff]">
                    Top bidder
                  </p>
                  <p className="mt-3 text-2xl font-black">
                    {auction?.highestBidder &&
                    auction.highestBidder !== ZERO_ADDRESS
                      ? shortAddress(auction.highestBidder)
                      : "No bids"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-[#213246] bg-[#101822] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#78d7ff]">
                    Seller
                  </p>
                  <p className="mt-3 text-2xl font-black">
                    {auction?.seller &&
                    auction.seller !== ZERO_ADDRESS
                      ? shortAddress(auction.seller)
                      : "--"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[30px] border border-white/10 bg-[#101723] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.30)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#132130] text-[#62c5ff]">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Create auction</h3>
                  <p className="text-sm text-[#9fb2c7]">
                    List a small item with a fixed timer.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                    Item name
                  </span>
                  <input
                    className="rounded-2xl border border-[#213246] bg-[#0b1118] px-4 py-3 outline-none"
                    maxLength={MAX_ITEM_NAME_LENGTH}
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                    Item note
                  </span>
                  <textarea
                    className="min-h-24 rounded-2xl border border-[#213246] bg-[#0b1118] px-4 py-3 outline-none"
                    maxLength={MAX_ITEM_NOTE_LENGTH}
                    value={itemNote}
                    onChange={(event) => setItemNote(event.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                      Start bid
                    </span>
                    <input
                      className="rounded-2xl border border-[#213246] bg-[#0b1118] px-4 py-3 outline-none"
                      value={startingBidEth}
                      onChange={(event) => setStartingBidEth(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                      Hours
                    </span>
                    <input
                      className="rounded-2xl border border-[#213246] bg-[#0b1118] px-4 py-3 outline-none"
                      value={durationHours}
                      onChange={(event) => setDurationHours(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              {chainId !== base.id && isConnected ? (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#62c5ff] px-4 py-3 font-semibold text-[#041018] disabled:opacity-60"
                  disabled={switching}
                  onClick={() => switchChain({ chainId: base.id })}
                >
                  {switching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Switch to Base
                </button>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#62c5ff] px-4 py-3 font-semibold text-[#041018] disabled:opacity-50"
                  disabled={!canCreate || writing || confirming}
                  onClick={createAuction}
                >
                  {writing || confirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gavel className="h-4 w-4" />
                  )}
                  Create on Base
                </button>
              )}
            </section>

            <section className="rounded-[30px] border border-white/10 bg-[#101723] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.30)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#132130] text-[#62c5ff]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Bid panel</h3>
                  <p className="text-sm text-[#9fb2c7]">
                    Load one auction and place a higher bid.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                    Auction ID
                  </span>
                  <input
                    className="rounded-2xl border border-[#213246] bg-[#0b1118] px-4 py-3 outline-none"
                    value={auctionIdInput}
                    onChange={(event) => setAuctionIdInput(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#62c5ff]">
                    Bid amount
                  </span>
                  <input
                    className="rounded-2xl border border-[#213246] bg-[#0b1118] px-4 py-3 outline-none"
                    value={bidEth}
                    onChange={(event) => setBidEth(event.target.value)}
                  />
                </label>
              </div>

              <button
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 font-semibold text-[#041018] disabled:opacity-50"
                disabled={!canBid || writing || confirming}
                onClick={placeBid}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trophy className="h-4 w-4" />
                )}
                Place bid
              </button>

              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#2d4158] bg-[#0b1118] px-4 py-3 font-semibold text-white disabled:opacity-50"
                disabled={!canSettle || writing || confirming}
                onClick={settleAuction}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TimerReset className="h-4 w-4" />
                )}
                Settle auction
              </button>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-[#09111a] p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.30)]">
              <h3 className="text-2xl font-black">Status feed</h3>
              <p className="mt-4 min-h-16 text-sm leading-6 text-[#a9bfd5]">
                {statusText}
              </p>

              {!miniAuctionContractAddress ? (
                <p className="rounded-[18px] border border-white/10 bg-white/5 p-3 text-xs leading-6 text-[#9fdcff]">
                  Add `NEXT_PUBLIC_MINI_AUCTION_CONTRACT_ADDRESS` after
                  deploying the auction contract, then redeploy Vercel.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
