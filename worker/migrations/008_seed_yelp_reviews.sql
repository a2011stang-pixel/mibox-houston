-- Seed 5 Yelp reviews
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, is_featured, is_active)
VALUES ('R K.', 5, '2024-05', 'Amazing service -- so incredibly helpful too. MI BOX did in an hour what PODS couldn''t accomplish in 3 days', 'MI BOX did in an hour what PODS couldn''t accomplish in 3 days', 'storage', 'yelp', 1, 1);

INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'R K.' AND source = 'yelp'), 'pods-comparison');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'R K.' AND source = 'yelp'), 'competitor-switch');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'R K.' AND source = 'yelp'), 'homepage');

INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, is_featured, is_active)
VALUES ('Nicole B.', 5, '2025-04', 'Need to store my entire house while moving to new home. They were kind. Walked me through the whole process. Helped answer questions on what size I needed. Looked at pictures. Quote was fast. Great price. Date options were better than big chains. No jerking you around. So far I''m very happy. Locally owned and operated and pride themselves on beating the name brand competition. They have my vote. I''ll review again when I pickup and deliver.', 'Date options were better than big chains. No jerking you around.', 'moving', 'yelp', 1, 1);

INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Nicole B.' AND source = 'yelp'), 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Nicole B.' AND source = 'yelp'), 'pods-comparison');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Nicole B.' AND source = 'yelp'), 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Nicole B.' AND source = 'yelp'), 'homepage');

INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, is_featured, is_active)
VALUES ('Phoebe R.', 5, '2024-01', 'High marks for Mi Box and I will absolutely book them again on the next move. Mi Box process was seamless all the way around. Great customer service, Madonna was very responsive on all calls and questions. When the container was delivered, they placed it precisely where I wanted it, and the entire delivery took less than 10 mins. Driver is highly skilled with hydraulic system of the container drop and there was no dragging on my driveway. Pickup and relocation was perfect. Very clean containers. Mi Box has this process red carpeted for you and makes your move so much smoother. Highly recommend them if you need on location storage.', 'Mi Box has this process red carpeted for you', 'both', 'yelp', 1, 1);

INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Phoebe R.' AND source = 'yelp'), 'how-it-works');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Phoebe R.' AND source = 'yelp'), 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Phoebe R.' AND source = 'yelp'), 'homepage');

INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, is_featured, is_active)
VALUES ('Sean G.', 5, '2022-12', 'Can''t say enough good things about Mi-Box moving and storage. Not only do they have the most competitive rates I found in the Houston area (I got estimates from multiple container companies), their pickup and delivery is super clean. No dragging containers up and down your driveway like a dumpster, scarring the concrete/asphalt. Their trucks pick the unit up, and drop it with hydraulic extendable arms. Their onsite storage options are very reasonable as well. I originally anticipated on keeping the unit here, but my HOA had other ideas, so I had to request them to store it there. They''re very accommodating and super quick response. It was picked up the next day after I called. Another plus is the containers are extremely well taken care of. Very clean. Highly recommend Mi-Box for your moving and storage needs.', 'Most competitive rates I found in the Houston area', 'both', 'yelp', 0, 1);

INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Sean G.' AND source = 'yelp'), 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Sean G.' AND source = 'yelp'), 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Sean G.' AND source = 'yelp'), 'how-it-works');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Sean G.' AND source = 'yelp'), 'homepage');

INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, source, is_featured, is_active)
VALUES ('Brandi C.', 5, '2023-04', 'Our family is in the middle of a big move, and everyone at this company has been professional write down to the delivery driver of the box. The delivery driver let me know about some grass damage that happened to our neighbors grass while picking up a box and delivering another. Shortly after he left, the company came back out and fixed the damage. Both our neighbor and us were very surprised and very happy. And being on narrow streets, I am sure that this could happen to anyone. This was exceptional customer service, and I will use them anytime we need to move anything.!!', 'The company came back out and fixed the damage. Exceptional customer service.', 'moving', 'yelp', 0, 1);

INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Brandi C.' AND source = 'yelp'), 'moving');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Brandi C.' AND source = 'yelp'), 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES ((SELECT id FROM reviews WHERE reviewer_name = 'Brandi C.' AND source = 'yelp'), 'locally-owned');
