import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import{ BigNumber, Contract, providers, utils } from "ethers";
import React,{ useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import{ NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from "../constants";
import Header from './Header';
import Footer from './Footer';
import { useRouter } from 'next/router';
export default function Home() {

  const router = useRouter();

  const zero = BigNumber.from(0);
  const[walletConnected, setWalletConnected] = useState(false);
  const[loading, setLoading] = useState(false);
  const[tokenToBeClaimed, setTokenToBeClaimed] = useState(zero);
  const[balanceOfAzogDevTokens, setBalanceOfAzogDevTokens] = useState(zero);
  const[tokenAmount, setTokenAmount] = useState(zero);
  const[tokenMinted, setTokenMinted] = useState(zero);
  const web3Refs = useRef();

  const getTokensToBeClaimed = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      if(balance === zero){
        setTokenToBeClaimed(zero);
      } else{
        var amount = 0;
        for(var i=0; i<balance; i++){
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await nftContract.tokenIdsClaimed(tokenId);
          if(!claimed){
            amount++;
          }
        }
        setTokenToBeClaimed(BigNumber.from(amount));
      }
    } catch(err){
      console.log(err);
      setTokenToBeClaimed(zero);
    }
  };

    const getBalanceOfAzogDevTokens = async()=>{
      try{
        const provider = await getProviderOrSigner();
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        const balance = await tokenContract.balanceOf(address);
        setBalanceOfAzogDevTokens(balance);
      } catch(err){
        console.log(err);
        setBalanceOfAzogDevTokens(zero);
      }
    };

    const mintAzogDevTokens = async(amount)=>{
      try{
        const signer = await getProviderOrSigner(true);
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
        const value = 0.001 * amount;
        const tx = await tokenContract.mint(amount,{
          value: utils.parseEther(value.toString()),
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("successfully Minted Azog Dev Tokens");
        await getBalanceOfAzogDevTokens();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
      } catch(err){
        console.log(err);
      }
    };

    const claimAzogDevTokens = async()=>{
      try{
        const signer = await getProviderOrSigner(true);
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
        const tx = await tokenContract.claim();
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("successfully Minted Azog Dev Tokens");
        await getBalanceOfAzogDevTokens();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
      } catch(err){
        console.log(err);
      }
    };

    const getTotalTokensMinted = async()=>{
      try{
        const provider = await getProviderOrSigner();
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
        const _tokenMinted = await tokenContract.totalSupply();
        setTokenMinted(_tokenMinted);
      } catch(err){
        console.log(err);
      }
    };

    const getProviderOrSigner = async(needSigner = false) =>{
      const provider = await web3Refs.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const {chainId} = await web3Provider.getNetwork();
      if(chainId !== 4){
        window.alert("Change Network To Rinkeby");
        throw new Error("Change Network To Network");
      }
      if(needSigner){
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;
    };

    const connectWallet = async()=>{
      try{
        await getProviderOrSigner();
        setWalletConnected(true);
      } catch(err){
        console.log(err);
      }
    };

    useEffect(()=>{
      if(!walletConnected){
        web3Refs.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disabledInjectedProvider: false,
        });
        connectWallet();
        getTotalTokensMinted();
        getBalanceOfAzogDevTokens();
        getTokensToBeClaimed();
      }
    }, [walletConnected]);

    const renderButton = ()=>{
      if(loading){
        return(
          <div>
            <button className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"> Loading... </button>
          </div>
        );
      }

      if(getTokensToBeClaimed > 0){
        return(
          <div>
            <div className="text-white">
              {tokenToBeClaimed * 10} Tokens To Be Claimed
            </div>
            <button className="text-white block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={claimAzogDevTokens}>Claim Tokens</button>
          </div>
        );
      }

      return(
        <div className="grid grid-cols-2 gap-4 p-8 text-center">

            <input className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" placeholder="Enter Amount Of Tokens" type="number" onChange={(e)=> setTokenAmount(BigNumber.from(e.target.value))} />

          <button className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" disabled={!(tokenAmount > 0)} onClick={()=>mintAzogDevTokens(tokenAmount)}> Mint Tokens </button>
          <button className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>router.push('https://minted-dao-ravi-ravinthiranpartheepan1407.vercel.app/')}> NFT Mint </button>
          <button className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>router.push('https://dao-v1-ravi.vercel.app/')}> DAO(V1) </button>

        </div>
      );
    };

  return (
    <div>
    <Header />
      <div>
        <br />
        <h1 className="text-white text-2xl text-center"> Azog Dev DAO Tokens </h1>
        <p className="text-white text-center p-8"> You Can Claim or Mint Azog Dev Tokens Here </p>
      </div>
      {walletConnected ? (
        <div className="grid grid-cols-3 gap-4 p-8 text-center">
          <div className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-white">
            You have minted {utils.formatEther(balanceOfAzogDevTokens)} Azog Dev Tokens
          </div>
          <div className="text-white block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            Overall {utils.formatEther(tokenMinted)} / 1000000 have been minted!!!
          </div>
          {renderButton()}
        </div>
        ):(
            <button className="block text-white p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 bg-rose-900 dark:border-gray-700 dark:hover:bg-gray-700" onClick={connectWallet}> Connect Your Wallet </button>
          )}

          <br />
            <Footer />

    </div>
  );
}
