-- Users
INSERT INTO public.users (id, username, pin, role, active) VALUES
('1', 'Sant', '1521', 'ADMIN', TRUE),
('1d4ba327-1f89-43d7-b358-d744be8ab948', 'canje', '12234', 'REDEEMER', TRUE);

-- Stores
INSERT INTO public.stores (id, name, address, whatsapp, probability, active) VALUES
('da643310-bd95-4fd0-afc3-1a0a1ec9f03c', 'Sansol', 'Av Angelelli N°18', '3804802554', 50, TRUE),
('45217744-e266-471e-b912-778362d55422', 'AB store', 'av madre teresa de calcuta', '3804533112', 40, TRUE);

-- Prizes
INSERT INTO public.prizes (id, name, description, stock, active) VALUES
('1', 'Premio Especial', '¡Ganaste el juego!', 999, TRUE);

-- Ads
INSERT INTO public.ads (id, name, type, url, duration_sec, priority, active, created_at) VALUES
('208ccad6-3ab7-4822-9f25-dffafa62ab98', 'sansol', 'image', '/media/ads/1769617035236-p09u6m.png', 10, TRUE, TRUE, '2026-01-28T16:17:15.325Z'),
('a98220c7-58d6-4131-a1f3-b049555999d0', 'AB', 'image', '/media/ads/1769617057511-2h6dxj.jpeg', 10, FALSE, TRUE, '2026-01-28T16:17:37.518Z'),
('e6b0fd68-aa3c-415f-973e-5de8685645da', 'auto', 'image', '/media/ads/1769617743706-5pjxq6.jpg', 10, FALSE, TRUE, '2026-01-28T16:29:03.719Z'),
('6d9920b8-f9cc-4b94-8aa5-33bc1312d568', 'intro', 'video', '/media/ads/1769622189636-88jmv7.mp4', 8, TRUE, TRUE, '2026-01-28T17:43:09.649Z');

-- Questions
INSERT INTO public.questions (id, question, options, correct_key, active) VALUES
('1', 'Cuantos Años tiene Agus', '{"0":"Madrid","1":"París","2":"Londres","S":"1 ño","A":"10años","B":"11años"}', 'B', TRUE),
('2', 'Sansol donde esta Ubicado ', '{"S":"Av San nicolas de bari","A":"Av madre tesera de calcuta ","B":"av angelelli"}', 'B', TRUE),
('3', '¿Provincia donde estamos?', '{"S":"La Rioja","A":"Catamarca","B":"San Juan"}', 'B', TRUE),
('adbbd184-eee9-41d5-946f-37fc55bb249b', 'Nose', '{"S":"1","A":"2","B":"3"}', 'B', TRUE);

-- Machines
INSERT INTO public.machines (id, name, location, is_operational, last_seen_at) VALUES
('ec6315df-9caa-438c-9864-2813118a7e53', 'Terminal K-2', 'Nueva Ubicación', TRUE, '2026-01-29T10:12:28.308Z');

-- Chango Config
INSERT INTO public.chango_config (id, difficulty, time_limit, game_cooldown_seconds, result_duration_seconds, priority_ad_duration_seconds, qr_display_seconds, updated_at) VALUES
('default', 3, 20, 25, 1.5, 5, 10, '2026-01-29T16:27:36.754Z');

-- Wheel Segments
INSERT INTO public.wheel_segments (id, slot_index, label, color, probability, prize_id, store_id, active) VALUES
('1', 1, 'sansol', '#FF6B6B', 0.11, '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', TRUE),
('2', 2, 'SIGUE PARTICIPANDO', '#FECA57', 0.11, NULL, NULL, TRUE),
('3', 3, 'ab store', '#1DD1A1', 0.11, '1', '45217744-e266-471e-b912-778362d55422', TRUE),
('4', 4, 'VOLVÉ A INTENTAR', '#222F3E', 0.11, NULL, NULL, TRUE),
('5', 5, 'vaiju', '#FF3838', 0.11, '1', NULL, TRUE),
('6', 6, 'SIGUE PARTICIPANDO', '#F368E0', 0.23, NULL, NULL, TRUE),
('7', 7, 'eldk', '#5F27CD', 0.11, '1', NULL, TRUE),
('8', 8, 'VOLVÉ A INTENTAR', '#FF9F43', 0.11, NULL, NULL, TRUE);

-- Tickets
INSERT INTO public.tickets (id, token, game_type, prize_id, store_id, created_at, redeemed_at, redeemed_by) VALUES
('8581ff13-9d98-4165-8c5b-e361c1e02a39', 'HNQ8R9GH', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T09:49:38.656Z', NULL, NULL),
('0e9ec1df-0c4f-4aa0-b415-03499ef6652d', 'O0K7TBMX', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:10:17.575Z', NULL, NULL),
('1f10977d-5172-4964-9257-30204d93bec6', 'VQC5ESCR', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:17:38.482Z', NULL, NULL),
('d2459b3f-103f-4741-9dc9-ceaa212f0595', 'GPNEUNJ3', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:44:35.514Z', NULL, NULL),
('0b3f8cfb-d6cf-4f23-a6b4-ba750a7c11c1', 'IP4W4XR8', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:45:24.188Z', NULL, NULL),
('ac0c920d-a8d1-4894-82b0-32788a8f46bc', 'MMQB8X9E', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:46:02.306Z', NULL, NULL),
('cbb26093-3292-4f10-8fbe-1ee4f9c3ac87', 'TXZT5EPW', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:52:22.996Z', NULL, NULL),
('3e505425-637e-4a4c-828d-c77174aa0e95', 'VQK3F8CH', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:53:02.823Z', NULL, NULL),
('593ff9ef-2892-4034-af99-3c53d74e85da', 'X2H0GOG8', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T10:53:53.648Z', NULL, NULL),
('a1d7b38d-b59a-4e93-b403-b124a944aa4c', 'Z5QJB68I', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T11:43:20.745Z', NULL, NULL),
('5046369f-0751-4c5f-b46e-7990ee380e4a', '2Q1R4NH3', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T11:48:22.964Z', NULL, NULL),
('65508225-4133-4037-ab1c-ad75b469cc65', 'EBU4ZZBT', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T11:48:57.548Z', NULL, NULL),
('92c57cbd-4cc5-40b8-a926-8328b46dae0d', 'JRP0XDQO', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T11:49:49.532Z', NULL, NULL),
('74593809-7e88-4cbd-93c7-9309ba055923', 'ZB8M689P', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T11:59:22.101Z', NULL, NULL),
('a5ab4a8e-1191-40a6-953d-2b2ded32fad5', 'U1WNK98K', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T11:59:59.953Z', NULL, NULL),
('b1caf8c5-753a-4c04-a61e-06de0dd29d16', 'JNROAWGV', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-28T12:01:18.094Z', NULL, NULL),
('ed7e1301-0101-49c3-b6c7-416d04810d0a', 'GEZ7EIVX', 'ruleta', '1', NULL, '2026-01-28T17:03:55.100Z', NULL, NULL),
('616f6ac3-ee4e-45f7-89f8-c2ffb7c33c3c', 'UYAXJ1KD', 'ruleta', '1', NULL, '2026-01-28T17:14:40.686Z', NULL, NULL),
('472cd7e0-53eb-4cbb-b1fe-93f912adf718', 'QQ3R6EFU', 'chango', '1', NULL, '2026-01-28T17:46:27.900Z', NULL, NULL),
('dd628fe0-13f1-4c2d-8933-5ae7579809e0', 'PALNWC3Z', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T09:48:08.967Z', NULL, NULL),
('6bda029d-68f4-49a6-8fc0-5510d5597dd2', 'HTAPGX4N', 'ruleta', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T09:49:39.980Z', NULL, NULL),
('7b37d4da-2f5d-44fd-a020-217fbfc4af5f', '0K6HH7N9', 'ruleta', '1', '57bc8040-4aec-4897-a8c9-ab162b577693', '2026-01-29T09:53:06.773Z', NULL, NULL),
('5d76d13f-30d7-402d-9bde-cc23920da33b', 'KXPR10SC', 'ruleta', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T10:09:02.160Z', NULL, NULL),
('7f9d67c0-f846-414b-af0c-bc5beb498dcc', 'SH4C6P2I', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T10:10:36.951Z', NULL, NULL),
('66d52e04-b258-4b4e-8747-c3325b244823', '594X6HQJ', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T12:19:10.775Z', NULL, NULL),
('5c1d598f-5b0e-49ae-a564-64f705e1d550', 'TYHJ5LNH', 'chango', '1', '45217744-e266-471e-b912-778362d55422', '2026-01-29T12:21:53.004Z', NULL, NULL),
('45399efa-8e0c-4cb9-a021-0f5f63cf5da3', 'MU3M376L', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T12:33:56.676Z', NULL, NULL),
('22370118-8b39-472a-a825-a6c3644176bc', 'AR8T7BXJ', 'ruleta', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T12:35:36.500Z', NULL, NULL),
('f24d2a7f-0563-4246-ae9b-af083b36aa42', 'LG3K9BGA', 'trivia', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T12:39:03.097Z', NULL, NULL),
('7ec6929a-abd4-4ba4-971d-966442e7e297', 'MAQM585R', 'trivia', '1', '45217744-e266-471e-b912-778362d55422', '2026-01-29T12:58:32.307Z', NULL, NULL),
('db2388a8-d8c0-48b2-bce1-dea3799b6fe6', 'IGM2XNTB', 'trivia', '1', '45217744-e266-471e-b912-778362d55422', '2026-01-29T12:59:16.753Z', NULL, NULL),
('2e055033-50c5-4ca0-8d11-34885f4b55eb', 'H3JFYGK5', 'chango', '1', '45217744-e266-471e-b912-778362d55422', '2026-01-29T16:05:27.409Z', NULL, NULL),
('673ca003-aa4f-4012-968e-f06ca3e4100b', 'KLJNTO64', 'ruleta', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T16:08:27.872Z', NULL, NULL),
('18cd7518-86a3-4735-97d4-357bee421ba4', 'PZT7DDZE', 'ruleta', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T16:10:44.378Z', NULL, NULL),
('a4e21098-cf8e-4f40-9d09-6f62bccc47b0', 'MDT6JOH0', 'chango', '1', 'da643310-bd95-4fd0-afc3-1a0a1ec9f03c', '2026-01-29T16:25:39.634Z', NULL, NULL);
-- Game Events
INSERT INTO public.game_events (id, game_type, started_at, finished_at, result, ticket_id, machine_id) VALUES
('e1', 'trivia', '2026-01-28T10:00:00Z', '2026-01-28T10:02:00Z', 'WIN', 't1', NULL),
('e2', 'ruleta', '2026-01-28T10:10:00Z', '2026-01-28T10:11:00Z', 'LOSE', NULL, NULL),
('e3', 'chango', '2026-01-28T10:20:00Z', '2026-01-28T10:22:00Z', 'WIN', 't2', NULL),
('e4', 'trivia', '2026-01-28T11:00:00Z', '2026-01-28T11:02:00Z', 'LOSE', NULL, NULL),
('e5', 'ruleta', '2026-01-28T11:10:00Z', '2026-01-28T11:11:00Z', 'WIN', 't3', NULL),
('89b8c083-c21a-42e2-81c9-e23d52109106', 'trivia', '2026-01-28T16:53:09.878Z', '2026-01-28T16:53:14.784Z', 'LOSE', NULL, NULL),
('821107b4-06ae-4889-ba12-e6004d7bcaaa', 'trivia', '2026-01-28T17:03:05.805Z', '2026-01-28T17:03:16.698Z', 'LOSE', NULL, NULL),
('27941e86-e1c7-4e80-803f-8a345d6b73aa', 'ruleta', '2026-01-28T17:03:46.138Z', '2026-01-28T17:03:55.118Z', 'WIN', 'ed7e1301-0101-49c3-b6c7-416d04810d0a', NULL),
('e482b760-0ba3-46f7-a370-ef9425b5eaa9', 'ruleta', '2026-01-28T17:13:26.537Z', '2026-01-28T17:13:35.198Z', 'LOSE', NULL, NULL),
('38fdd894-3bd9-4958-b1a1-be0433ec9cd8', 'ruleta', '2026-01-28T17:14:29.753Z', '2026-01-28T17:14:40.695Z', 'WIN', '616f6ac3-ee4e-45f7-89f8-c2ffb7c33c3c', NULL),
('f80aec7c-24aa-48ed-aca0-6590b5c600c0', 'ruleta', '2026-01-28T17:21:53.561Z', '2026-01-28T17:22:03.668Z', 'LOSE', NULL, NULL),
('d4baef20-268d-4036-b7db-89f369ff24d6', 'chango', '2026-01-28T17:27:10.930Z', '2026-01-28T17:27:21.037Z', 'LOSE', NULL, NULL),
('4fc2d1c1-6b56-4e68-b342-d2ff9c47ffc6', 'chango', '2026-01-28T17:28:45.550Z', '2026-01-28T17:28:55.737Z', 'LOSE', NULL, NULL),
('be005991-29dd-4c5f-b1ce-ec650c25148c', 'chango', '2026-01-28T17:31:01.607Z', '2026-01-28T17:31:11.690Z', 'LOSE', NULL, NULL),
('9ddf2ca8-23cc-4e78-89df-8014014e489b', 'chango', '2026-01-28T17:39:21.788Z', '2026-01-28T17:39:34.086Z', 'LOSE', NULL, NULL),
('989f2f16-4fac-4279-8227-f4b5bd3db803', 'chango', '2026-01-28T17:40:04.437Z', '2026-01-28T17:40:21.760Z', 'LOSE', NULL, NULL),
('3ab4d301-e714-4c2f-bbde-528515db9a46', 'chango', '2026-01-28T17:40:42.124Z', '2026-01-28T17:40:59.420Z', 'LOSE', NULL, NULL),
('c8fb204c-d450-48c8-b0c9-366be9022e1f', 'chango', '2026-01-28T17:41:20.590Z', '2026-01-28T17:41:37.917Z', 'LOSE', NULL, NULL),
('4d99d005-78ff-4ba1-a911-4be809bef01b', 'chango', '2026-01-28T17:44:38.655Z', '2026-01-28T17:44:56.216Z', 'LOSE', NULL, NULL),
('7ba08188-ebc5-468e-abc0-104476dff473', 'chango', '2026-01-28T17:46:11.435Z', '2026-01-28T17:46:28.183Z', 'WIN', '472cd7e0-53eb-4cbb-b1fe-93f912adf718', NULL),
('6fa9cbe0-68ec-4087-a554-f1deb6ab3b89', 'trivia', '2026-01-29T09:47:50.816Z', '2026-01-29T09:48:09.195Z', 'WIN', 'dd628fe0-13f1-4c2d-8933-5ae7579809e0', NULL),
('21dade73-b7fc-4b62-a251-bc046116b1d1', 'ruleta', '2026-01-29T09:49:17.360Z', '2026-01-29T09:49:40.051Z', 'WIN', '6bda029d-68f4-49a6-8fc0-5510d5597dd2', NULL),
('d9abe08f-a2fc-49a2-a760-26696ff1f45c', 'trivia', '2026-01-29T09:52:16.605Z', '2026-01-29T09:52:24.548Z', 'LOSE', NULL, NULL),
('3f5b5dc8-f26b-4ebe-a636-a9e2f95ef398', 'ruleta', '2026-01-29T09:52:46.035Z', '2026-01-29T09:53:06.847Z', 'WIN', '7b37d4da-2f5d-44fd-a020-217fbfc4af5f', NULL),
('9711631c-297a-4507-9e99-7485ce0a2e80', 'ruleta', '2026-01-29T10:08:45.983Z', '2026-01-29T10:09:02.241Z', 'WIN', '5d76d13f-30d7-402d-9bde-cc23920da33b', NULL),
('6017783e-c0ed-4262-9e64-f30a6ea1c632', 'trivia', '2026-01-29T10:09:56.517Z', '2026-01-29T10:10:09.540Z', 'LOSE', NULL, NULL),
('647325c9-c720-4f8b-8e69-02c295af40d6', 'trivia', '2026-01-29T10:10:27.650Z', '2026-01-29T10:10:36.976Z', 'WIN', '7f9d67c0-f846-414b-af0c-bc5beb498dcc', NULL),
('84cc5e48-876a-443f-ae83-66bc603390c0', 'trivia', '2026-01-29T12:18:07.944Z', '2026-01-29T12:18:18.766Z', 'LOSE', NULL, NULL),
('ab530d17-ad85-428b-851e-c5fbc35cb031', 'trivia', '2026-01-29T12:18:52.769Z', '2026-01-29T12:19:10.977Z', 'WIN', '66d52e04-b258-4b4e-8747-c3325b244823', NULL),
('23582be7-e1db-4026-b05f-6cec9baf384c', 'ruleta', '2026-01-29T12:20:09.109Z', '2026-01-29T12:20:26.487Z', 'LOSE', NULL, NULL),
('4c79a7ac-8368-4396-8e5d-b95266ae773f', 'ruleta', '2026-01-29T12:20:44.319Z', '2026-01-29T12:21:00.530Z', 'LOSE', NULL, NULL),
('26117c36-43bb-42cc-a177-9f3daacb3235', 'chango', '2026-01-29T12:21:35.289Z', '2026-01-29T12:21:53.387Z', 'WIN', '5c1d598f-5b0e-49ae-a564-64f705e1d550', NULL),
('cb7845d6-0d21-4f9a-9b0a-ca8b354f668c', 'trivia', '2026-01-29T12:33:47.835Z', '2026-01-29T12:33:56.854Z', 'WIN', '45399efa-8e0c-4cb9-a021-0f5f63cf5da3', NULL),
('4c669a68-dde6-4e61-8026-359d84767fae', 'ruleta', '2026-01-29T12:34:46.100Z', '2026-01-29T12:35:01.857Z', 'LOSE', NULL, NULL),
('ea2d9824-664b-42d1-97cc-aed0b22d314f', 'ruleta', '2026-01-29T12:35:19.136Z', '2026-01-29T12:35:36.565Z', 'WIN', '22370118-8b39-472a-a825-a6c3644176bc', NULL),
('b940fc93-6a3d-46fd-84f9-3b7432fad794', 'trivia', '2026-01-29T12:38:50.325Z', '2026-01-29T12:39:03.145Z', 'WIN', 'f24d2a7f-0563-4246-ae9b-af083b36aa42', NULL),
('c32a6a64-f296-4b95-96b7-d1835de2a723', 'trivia', '2026-01-29T12:58:21.624Z', '2026-01-29T12:58:32.357Z', 'WIN', '7ec6929a-abd4-4ba4-971d-966442e7e297', NULL),
('aaadeea3-6f7d-49d8-b985-0b4146e2a9b1', 'trivia', '2026-01-29T12:59:08.155Z', '2026-01-29T12:59:16.780Z', 'WIN', 'db2388a8-d8c0-48b2-bce1-dea3799b6fe6', NULL),
('07885692-4cac-4f41-a4cf-b6421dfddd61', 'trivia', '2026-01-29T13:51:48.729Z', '2026-01-29T13:51:51.908Z', 'LOSE', NULL, NULL),
('b2114b9c-d64a-4f52-ad96-1e8af40c102b', 'trivia', '2026-01-29T13:52:14.505Z', '2026-01-29T13:52:25.918Z', 'LOSE', NULL, NULL),
('27a50055-3d26-4f58-9224-e1cf6fe7a261', 'trivia', '2026-01-29T13:52:14.505Z', '2026-01-29T13:52:25.924Z', 'LOSE', NULL, NULL),
('34b8a4b5-663a-4253-be95-0115f2c4812a', 'trivia', '2026-01-29T13:57:26.324Z', '2026-01-29T13:57:31.493Z', 'LOSE', NULL, NULL),
('2cfaf248-3fa6-42e8-9b70-5c7ceaced197', 'trivia', '2026-01-29T13:57:54.728Z', '2026-01-29T13:57:59.595Z', 'LOSE', NULL, NULL),
('3c6c351e-f31a-464c-b3f0-e1e969249121', 'chango', '2026-01-29T13:58:31.515Z', '2026-01-29T13:58:52.427Z', 'LOSE', NULL, NULL),
('d80e77ce-8f64-4833-ab9b-0305d3a15439', 'chango', '2026-01-29T14:04:02.293Z', '2026-01-29T14:04:32.258Z', 'LOSE', NULL, NULL),
('714315a8-35d4-46bc-9ef1-b342e2326828', 'chango', '2026-01-29T14:08:03.872Z', '2026-01-29T14:08:32.970Z', 'LOSE', NULL, NULL),
('87390af3-cbb1-42b8-b330-5cddc72708c9', 'chango', '2026-01-29T16:05:07.240Z', '2026-01-29T16:05:28.060Z', 'WIN', '2e055033-50c5-4ca0-8d11-34885f4b55eb', NULL),
('44dbb59f-df47-4336-b0b6-7d5260461ce4', 'ruleta', '2026-01-29T16:08:04.960Z', '2026-01-29T16:08:27.946Z', 'WIN', '673ca003-aa4f-4012-968e-f06ca3e4100b', NULL),
('d8fc50db-318e-4e4d-acad-5a74bea45bef', 'ruleta', '2026-01-29T16:10:25.854Z', '2026-01-29T16:10:44.424Z', 'WIN', '18cd7518-86a3-4735-97d4-357bee421ba4', NULL),
('c82a6c56-08c0-4ff3-93cc-42478e075838', 'chango', '2026-01-29T16:25:21.115Z', '2026-01-29T16:25:40.268Z', 'WIN', 'a4e21098-cf8e-4f40-9d09-6f62bccc47b0', NULL);
