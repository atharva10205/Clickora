use anchor_lang::prelude::*;
declare_id!("5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw");

const SERVICE_FEE: &str = "C3qzo7FpXSgQ7ytMdjhqjd3R5ZWReEYFeHdKD7oyXpLz";
const PLATFORM_FEE_BASIS_POINTS: u64 = 10;

#[program]
pub mod my_project {
    use super::*;

    pub fn initialise_ad(ctx: Context<InitializeAd>, ad_id: [u8; 32]) -> Result<()> {
        let ad = &mut ctx.accounts.ad;
        ad.ad_id = ad_id;
        ad.advertiser = *ctx.accounts.advertiser.key;
        ad.authority = *ctx.accounts.authority.key;
        ad.is_active = true;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, AdError::InvalidAmount);
        ctx.accounts.ad.is_active = true;

        let fee = amount
            .checked_mul(PLATFORM_FEE_BASIS_POINTS)
            .ok_or(AdError::Overflow)?
            .checked_div(1000)
            .ok_or(AdError::Overflow)?;

        let amount_to_vault = amount.checked_sub(fee).ok_or(AdError::Overflow)?;

        if fee > 0 {
            let fee_txn = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.advertiser.key,
                &ctx.accounts.service_fee.key,
                fee,
            );

            anchor_lang::solana_program::program::invoke(
                &fee_txn,
                &[
                    ctx.accounts.advertiser.to_account_info(),
                    ctx.accounts.service_fee.to_account_info(),
                ],
            )?;
        }

        let vault_txn = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.advertiser.key(),
            &ctx.accounts.vault.key(),
            amount_to_vault,
        );

        anchor_lang::solana_program::program::invoke(
            &vault_txn,
            &[
                ctx.accounts.advertiser.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;
        Ok(())
    }

    pub fn record_impression(ctx: Context<RecordImpression>, amount: u64) -> Result<()> {
        let ad = &ctx.accounts.ad;

        require!(ad.is_active, AdError::AdInactive);
        require!(amount > 0, AdError::InvalidAmount);

        let vault_lamports = ctx.accounts.vault.to_account_info().lamports();
        require!(vault_lamports >= amount, AdError::InsufficientVault);

        require_keys_eq!(
            ad.authority,
            *ctx.accounts.signer.key,
            AdError::Unauthorized
        );
        let vault_lamports = ctx.accounts.vault.lamports();
        let current_claimable = ctx.accounts.earnings.claimable_amount;

        let checked = current_claimable.checked_add(amount);
        let total_owed_after;

        if checked.is_none() {
            return Err(AdError::Overflow.into());
        } else {
            total_owed_after = checked.unwrap();
        }
        if vault_lamports < total_owed_after {
            return Err(AdError::InsufficientVault.into());
        }

        let earnings = &mut ctx.accounts.earnings;
        earnings.publisher = ctx.accounts.publisher.key();
        earnings.ad = ctx.accounts.ad.key();
        earnings.claimable_amount = total_owed_after;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>,claimable_amount:u64 ) -> Result<()> {

        require!(claimable_amount > 0, AdError::InvalidAmount);

        let ad_id = ctx.accounts.ad.ad_id;
        let advertiser_key = ctx.accounts.advertiser.key();
        let bump = ctx.bumps.vault;

        let seeds: &[&[u8]] = &[b"vault", advertiser_key.as_ref(), ad_id.as_ref(), &[bump]];
        let signer_seeds = &[seeds];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.publisher.key(),
                claimable_amount,
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.publisher.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }

    pub fn refund(ctx: Context<Refund>, withdraw_amount: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.ad.advertiser,
            ctx.accounts.signer.key(),
            AdError::Unauthorized
        );

        let advertiser_key = ctx.accounts.advertiser_key.key();
        let ad_id = ctx.accounts.ad.ad_id;
        let bump = ctx.bumps.vault;

        let vault_seed: &[&[u8]] = &[b"vault", advertiser_key.as_ref(), ad_id.as_ref(), &[bump]];
        let vault_lamports = ctx.accounts.vault.to_account_info().lamports();
        let signer_seeds = &[vault_seed];

        let rent = Rent::get()?;
        let min_rent = rent.minimum_balance(0);
        let max_withdrawable = vault_lamports.saturating_sub(min_rent);

        require!(withdraw_amount > 0, AdError::InvalidAmount);
        require!(
            withdraw_amount <= max_withdrawable,
            AdError::InsufficientVault
        );
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.recipient.key(),
                withdraw_amount,
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        ctx.accounts.ad.is_active = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        seeds = [b"vault", advertiser_key.key().as_ref(), ad.ad_id.as_ref()],
        bump
    )]
    /// CHECK: vault PDA, seeds and bump verified by constraint above
    pub vault: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"ad", advertiser_key.key().as_ref(), ad.ad_id.as_ref()],
        bump
    )]
    pub ad: Account<'info, Ad>,

    /// CHECK: only for PDA seed
    pub advertiser_key: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: recipient of refund funds
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        mut,
        seeds = [b"vault", advertiser.key().as_ref(), ad.ad_id.as_ref()],
        bump
    )]
    /// CHECK: vault PDA, seeds and bump are verified by the constraint above
    pub vault: AccountInfo<'info>,

    #[account(
        seeds = [b"ad", advertiser.key().as_ref(), ad.ad_id.as_ref()],
        bump
    )]
    pub ad: Account<'info, Ad>,

    /// CHECK: only for PDA seed
    pub advertiser: UncheckedAccount<'info>,

    #[account(mut)]
    pub publisher: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ad_id:[u8;32])]
pub struct InitializeAd<'info> {
    #[account(
        init,
        payer = advertiser,
        space = 8 + Ad::MAX_SIZE,
        seeds = [b"ad", advertiser.key().as_ref(), ad_id.as_ref()],
        bump
    )]
    pub ad: Account<'info, Ad>,

    #[account(
        mut,
        seeds = [b"vault", advertiser.key().as_ref(), ad_id.as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub advertiser: Signer<'info>,

    /// CHECK:ok
    pub authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"ad", advertiser.key().as_ref(), ad.ad_id.as_ref()],
        bump
    )]
    pub ad: Account<'info, Ad>,

    #[account(
        mut,
        seeds = [b"vault", advertiser.key().as_ref(), ad.ad_id.as_ref()],
        bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub advertiser: Signer<'info>,

    #[account(
        mut,
        constraint = service_fee.key().to_string() == SERVICE_FEE @ AdError::InvalidFeeRecipient
    )]
    /// CHECK:ok
    pub service_fee: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordImpression<'info> {
    #[account(
        mut,
        seeds=[b"ad", advertiser.key().as_ref(), ad.ad_id.as_ref()],
        bump
    )]
    pub ad: Account<'info, Ad>,

    #[account(
        mut,
        seeds = [b"vault", advertiser.key().as_ref(), ad.ad_id.as_ref()],
        bump)]
    pub vault: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + EarningsRecord::MAX_SIZE,
        seeds = [b"earnings", ad.key().as_ref(), publisher.key().as_ref()],
        bump
    )]
    pub earnings: Account<'info, EarningsRecord>,

    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: only used for PDA seed derivation
    pub advertiser: UncheckedAccount<'info>,

    /// CHECK:ok
    pub publisher: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Ad {
    pub ad_id: [u8; 32],
    pub advertiser: Pubkey,
    pub authority: Pubkey,
    pub is_active: bool,
}

#[account]
pub struct EarningsRecord {
    pub publisher: Pubkey,
    pub ad: Pubkey,
    pub claimable_amount: u64,
}

impl EarningsRecord {
    pub const MAX_SIZE: usize = 32 + 32 + 8;
}

impl Ad {
    pub const MAX_SIZE: usize = 32 + 32 + 32 + 1;
}
#[error_code]
pub enum AdError {
    #[msg("Unauthorized.")]
    Unauthorized,
    #[msg("Insufficient vault balance.")]
    InsufficientVault,
    #[msg("Ad is not active.")]
    AdInactive,
    #[msg("Invalid amount.")]
    InvalidAmount,
    #[msg("Overflow in calculation.")]
    Overflow,
    #[msg("Invalid fee recipient.")]
    InvalidFeeRecipient,
}
