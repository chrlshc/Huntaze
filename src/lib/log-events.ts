// Centralized typed event names (extend as needed)
export type LogEventName =
  | 'ai_chat_completed'
  | 'ai_chat_rate_limited'
  | 'plan_spoof_attempt'
  | 'eventbridge_received'
  | 'event_dedup_skipped'
  | 'connect_checkout_created'
  | 'auth_login_success' | 'auth_login_failed' | 'auth_login_cognito_error'
  | 'auth_refresh_success' | 'auth_refresh_failed' | 'auth_refresh_cognito_error'
  | 'auth_logout_cognito_signed_out' | 'auth_logout_failed' | 'auth_logout_cognito_error'
  | 'auth_signup_success' | 'auth_signup_failed' | 'auth_signup_cognito_error'
  | 'confirm_signup_failed' | 'confirm_signup_cognito_error' | 'confirm_signup_auto_signin_unavailable'
  | 'resend_code_failed' | 'resend_code_cognito_error'
  | 'of_messages_fetch_failed' | 'of_message_send_failed'
  | 'media_upload_failed' | 'media_list_failed'
  | 'content_moderation_failed' | 'moderation_failed' | 'moderation_batch_failed'
  | 'tiktok_token_error' | 'tiktok_callback_failed' | 'tiktok_upload_failed' | 'tiktok_user_failed' | 'tiktok_disconnect_failed'
  | 'reddit_token_error' | 'reddit_callback_failed' | 'threads_token_error' | 'threads_callback_failed'
  | 'eventbridge_handler_failed' | 'checkout_completion_update_failed'
  | 'stripe_webhook_misconfigured' | 'stripe_signature_verification_failed' | 'stripe_webhook_handler_failed'
  | 'analytics_track_failed' | 'analytics_fetch_failed'
  | 'campaign_create_failed' | 'campaign_update_failed' | 'campaign_list_failed' | 'campaign_fetch_failed' | 'campaign_action'
  | 'rfm_calculation_failed' | 'rfm_recompute_failed' | 'rfm_store_segments_failed'
  | 'platform_onlyfans_connect_failed' | 'platform_connect_failed'
  | 'onboarding_backend_unreachable' | 'onboarding_backend_update_failed' | 'onboarding_force_complete_failed' | 'onboarding_save_profile_failed' | 'onboarding_save_ai_config_failed' | 'onboarding_save_ab_tests_failed' | 'onboarding_backend_unavailable'
  | 'cin_chat_failed' | 'cin_status_failed'
  | 'bypass_onboarding_failed' | 'dev_bypass_auth_failed'
  | 'waitlist_onlyfans_signup'
  | 'of_send_worker_start' | 'of_send_worker_stopped' | 'of_send_worker_already_running' | 'of_send_processing_batch' | 'of_send_message_failed' | 'of_send_batch_failed' | 'of_send_dm_started' | 'of_send_dm_completed' | 'of_send_dm_failed' | 'of_send_campaign_started' | 'of_send_campaign_completed' | 'of_send_campaign_failed' | 'of_campaign_recipient_updated' | 'of_campaign_error_threshold_exceeded' | 'of_automation_stopped' | 'of_automation_resumed' | 'of_campaign_stopped' | 'of_campaign_resumed'
  | 'of_sync_worker_start' | 'of_sync_worker_stopped' | 'of_sync_worker_already_running' | 'of_sync_cycle_started' | 'of_sync_cycle_completed' | 'of_sync_cycle_failed' | 'of_sync_skip_no_session' | 'of_session_stale_mark_reauth' | 'of_decrypt_cookies_failed' | 'of_sync_user_failed' | 'of_sync_inbox_started' | 'of_save_conversation' | 'of_save_message'
  | 'of_browser_send_stubbed' | 'of_browser_close_all'
  | 'tiktok_sandbox_token_test'
  ;

export type LogFn = <T extends Record<string, unknown>>(evt: LogEventName, props?: T) => void;

export const makeTypedReqLogger = (log: ReturnType<typeof import('./logger').makeReqLogger>) => ({
  info: ((evt, props) => log.info(evt, props)) as LogFn,
  warn: ((evt, props) => log.warn(evt, props)) as LogFn,
  error: ((evt, props) => log.error(evt, props)) as LogFn,
});
