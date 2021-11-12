import { useCallback, useEffect, useState } from 'react'
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js'
import {
  Program, Provider, web3
} from '@project-serum/anchor'

import kp from './keypair.json'
import idl from './idl.json'
import './App.css'

import {
  STATUS_WALLET_NOT_FOUND,
  STATUS_WALLET_FOUND,
  STATUS_WALLET_CONNECTED,
  STATUS_WALLET_CONNECTED_NO_ACCOUNT,
  STATUS_MESSAGES
} from './config.js'

const { SystemProgram } = web3

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address)

const network = clusterApiUrl('devnet')

const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const [status, setStatus] = useState(STATUS_WALLET_NOT_FOUND)
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])

  const getGifListWithLikes = (gifList, likeList) => {
    const list = gifList.map(gif => {
      return {
        ...gif,
        likes: likeList.filter(like => like.gifLink === gif.gifLink)
      }
    })

    return list
  }

  const walletLookup = async () => {
    try {
      const { solana } = window

      if (solana) {
        if (solana.isPhantom) {
          setStatus(STATUS_WALLET_FOUND)
          
          const response = await solana.connect({ onlyIfTrusted: true })
          setWalletAddress(response.publicKey.toString())
        }
      } else {
        setStatus(STATUS_WALLET_NOT_FOUND)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleWalletConnect = async () => {
    const { solana } = window

    if (solana) {
      try {
        const response = await solana.connect()
        setWalletAddress(response.publicKey.toString())
      } catch (error) {
        console.log(error)
      }
    }
  }

  const handleInputChange = (event) => {
    const { value } = event.target
    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
      setStatus(STATUS_WALLET_CONNECTED)
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getGifList = useCallback(async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      const gifList = getGifListWithLikes(account.gifList, account.likeList)
      
      console.log("Got the account", account)
      console.log('transformed gifList', gifList)

      setGifList(gifList)
      setStatus(STATUS_WALLET_CONNECTED)
    } catch (error) {
      console.log('Error getting gifList', error)
      setStatus(STATUS_WALLET_CONNECTED_NO_ACCOUNT)
    }
  }, [])

  const submitGif = async () => {
    if (!inputValue.length) return

    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      })
      console.log("GIF sucesfully sent to program", inputValue)

      await getGifList()
    } catch (error) {

    }
  };

  const handleGifLike = async (gif) => {
    const provider = getProvider()
    const program = new Program(idl, programID, provider)
    const user = provider.wallet.publicKey
    const address = user.toString()
    const alreadyLiked = gif.likes.find((like) => like.userAddress.toString() === address)

    if (alreadyLiked) {
      console.log('you already liked this gif!')
      return
    }

    await program.rpc.likeGif(gif.gifLink, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey
      }
    })
    console.log('user, ', provider.wallet.publicKey.toString())
    console.log("GIF sucesfully liked", gif)

    await getGifList()
  }

  useEffect(() => {
    if (walletAddress) {
      getGifList()
    }
  }, [walletAddress, getGifList])

  useEffect(() => {
    window.addEventListener('load', async () => {
      await walletLookup()
    })
  }, [])

  return (
    <div className="App">
      <div className="status">status: {STATUS_MESSAGES[status]}</div>
      {walletAddress && <div className="status">address: {walletAddress}</div>}
      <div className="container">
        <div className="header-container">
          <p className="header">Gifspace</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {status === STATUS_WALLET_FOUND && (
            <button className="cta-button connect-wallet-button" onClick={handleWalletConnect}>Connect Wallet</button>
          )}
          {status === STATUS_WALLET_CONNECTED_NO_ACCOUNT && (
            <div className="connected-container">
              <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                Do One-Time Initialization For GIF Program Account
              </button>
            </div>
          )}
          {status === STATUS_WALLET_CONNECTED && (
            <div className="connected-container">
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={handleInputChange}
              />
              <button
                className="cta-button submit-gif-button"
                onClick={submitGif}
              >
                Submit
              </button>
              <div className="gif-grid">
                {gifList.map((gif, index) => (
                  <div className="gif-item" key={gif.gifLink + index}>
                    <img src={gif.gifLink} alt={gif.gifLink} />
                    <div className='gif-item-footer'>
                      <div className='like-container'>
                        <button className='like' onClick={() => { handleGifLike(gif) }}>❤️</button>
                        <p className='like-count'>{gif.likes.length}</p>
                      </div>
                      <p className='gif-item-address'>{gif.userAddress.toString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
