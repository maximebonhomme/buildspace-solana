const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

const main = async() => {
  console.log("🚀 Starting test...")

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Buildspacesolana;

  const baseAccount = anchor.web3.Keypair.generate();
  
  const tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId
    },
    signers: [baseAccount],
  });

  console.log("📝 Your transaction signature", tx)

  console.log('fetching account...')
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey)
  console.log('done.')
  console.log('account', account)
  console.log('totalGifs', account.totalGifs)

  console.log('adding a gif......')
  await program.rpc.addGif('hello there', {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey 
    }
  })
  console.log('done.')
  console.log('fetching account...')
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('done.')
  console.log('account', account)
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();