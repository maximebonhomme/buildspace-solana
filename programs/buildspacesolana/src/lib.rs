use anchor_lang::prelude::*;

declare_id!("4HEaxf3M42QVJcPJbk8VQrpM55aZZQY33s7q95t3g1iN");

#[program]
pub mod buildspacesolana {
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
    // get account ref
    let base_account = &mut ctx.accounts.base_account;
    // Initialize total_gifs
    base_account.total_gifs = 0;
    Ok(())
  }

  pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
    let user = &mut ctx.accounts.user;

    let item = ItemStruct {
      gif_link: gif_link.to_string(),
      user_address: *user.to_account_info().key,
      // like_count: 0
    };

    base_account.gif_list.push(item);
    base_account.total_gifs += 1;
    Ok(())
  }

  pub fn like_gif(ctx: Context<LikeGif>, gif_link: String) -> ProgramResult {
    let base_account = &mut ctx.accounts.base_account;
    let user = &mut ctx.accounts.user;

    let user_address = LikeStruct {
      user_address: *user.to_account_info().key,
      gif_link: gif_link.to_string(),
    };

    base_account.like_list.push(user_address);

    Ok(())
  }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
  #[account(init, payer = user, space = 9000)]
  pub base_account: Account<'info, BaseAccount>,
  
  #[account(mut)]
  pub user: Signer<'info>,
  
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct LikeGif<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct LikeStruct {
  pub user_address: Pubkey,
  pub gif_link: String,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
  pub gif_link: String,
  pub user_address: Pubkey,
}

// Tell Solana what we want to store on this account.
#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
    pub like_list: Vec<LikeStruct>,
}