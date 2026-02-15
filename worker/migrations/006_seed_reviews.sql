-- Seed data: 46 Google Reviews for MI-BOX Houston
-- 44 reviews from conversation + 2 existing homepage testimonials
-- NOTE: ~35 more reviews exist on Google and need to be added via admin dashboard

-- Review 1: Jenny Landry
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Jenny Landry', 5, '2025-01', 'My experience with Mi-Box was pleasant. I needed a storage container for my driveway. I received replies to my messages on a Sunday night, which was not expected. They were friendly and courteous.', 'Received replies to my messages on a Sunday night', 'storage', 'Thank you for the great 5 star review!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (1, 'storage');
INSERT INTO review_tags (review_id, tag) VALUES (1, 'emergency');

-- Review 2: Chris Fordham
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Chris Fordham', 5, '2025-01', 'Mi-Box was very good at working with me getting a box dropped off at RenFest. They worked with the camp grounds as well to make sure they were opened.', 'Very good at working with me getting a box dropped off at RenFest', 'event', 'Thank you for the great review Chris. We are looking forward to working with you again next year!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (2, 'event');

-- Review 3: David Waddle
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('David Waddle', 5, '2024-12', 'I was very satisfied with the overall experience that I received from mi box moving and mobile storage of houston. Will use this company again in the future. Keep up the great work. Thank you.', 'Will use this company again in the future', 'both', 'Thank you for your business and the great review. All of us at MI-BOX appreciate you taking the time to write a review.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (3, 'storage');

-- Review 4: Amy Glenn (no tags - negative experience per instructions)
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Amy Glenn', 5, '2024-11', 'Was told they''d arrive between 11 and 12. I received a text saying they were on their way about 9. I was headed to an appointment but had to turn around and go home. They didn''t show, didn''t show and I finally texted at almost 10.', NULL, 'storage', 'Amy, we apologize for the delay, there were several unexpected events that contributed to us being late. We will do everything in our power to make sure everything goes well for you moving forward. Thank you for the feedback.', 0, 1);

-- Review 5: James Hallmon
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('James Hallmon', 5, '2024-11', '5 stars is just not enough for this company! They were amazing from start to finish!!! Price assessment...', '5 stars is just not enough for this company!', 'both', 'Thank you for the great review, James!', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (5, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (5, 'pricing');

-- Review 6: Shawn Hallmon
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Shawn Hallmon', 5, '2024-11', 'This is a locally run business and they are wonderful! They answer every call with professionalism and the best customer service. Quick with providing you a quote as well as making the process seamless. Their drivers go above and beyond.', 'This is a locally run business and they are wonderful!', 'both', 'Thank you Shawn for the great review and supporting small business.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (6, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (6, 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES (6, 'how-it-works');

-- Review 7: Nicole Berglund
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Nicole Berglund', 5, '2024-11', 'GO LOCAL GO MI BOX. I used MI BOX for 6 months of storage while selling my house and moving. They helped me calculate what size box I needed. They delivered the box and made sure it was secure in my driveway, stored it safely, and delivered it to my new home.', 'GO LOCAL GO MI BOX', 'both', 'Thank you for the wonderful review and recognizing our team.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (7, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (7, 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES (7, 'how-it-works');
INSERT INTO review_tags (review_id, tag) VALUES (7, 'moving');
INSERT INTO review_tags (review_id, tag) VALUES (7, 'storage');

-- Review 8: Jackson Smith
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Jackson Smith', 5, '2024-10', 'Mike was very helpful and patient! I had a couple more items and he went out of his way to help me get it on. Great experience. Totally recommend.', 'Mike went out of his way to help me', 'both', 'Thank you Jackson. Happy to help! Thank you for choosing MI-BOX and supporting a locally owned small business.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (8, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (8, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (8, 'locally-owned');

-- Review 9: Rene Santiago
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Rene Santiago', 5, '2024-10', 'Great service needed container for customer they gave me a great price and very prompt service will use in the future give these guys a call if you need great customer service.', 'Needed container for customer — great price and very prompt service', 'storage', 'Thanks for the great review Rene! We appreciate you supporting small, local business, as well.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (9, 'contractor');
INSERT INTO review_tags (review_id, tag) VALUES (9, 'pricing');

-- Review 10: Shani Smith
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Shani Smith', 5, '2024-09', 'Mi Box Moving and Storage provided excellent service from start to finish! Ileana, Mike, and Diane went above and beyond to make the entire process smooth, stress-free, and professional. Their customer service was top-notch — friendly, responsive, and always willing to help.', 'Excellent service from start to finish!', 'both', 'Wow! Thank you Shani for the great review. Congrats on the new home and we hope to serve you in the future.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (10, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (10, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (10, 'how-it-works');

-- Review 11: Kay Carlisle
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Kay Carlisle', 5, '2024-08', 'Mi-Box was fantastic to work with. If you want the best Pod company in the Houston area, I highly recommend Mi-Box. They''re accommodating, reliable and our experience was better than expected!', 'If you want the best Pod company in the Houston area, I highly recommend Mi-Box', 'both', 'Thank you Kay for the wonderful 5 star review!', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (11, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (11, 'pods-comparison');

-- Review 12: Evan Bahl
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Evan Bahl', 5, '2024-08', 'Great service great prices.', 'Great service great prices', 'moving', 'Thanks for leaving us a 5 star review, Evan!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (12, 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES (12, 'moving');

-- Review 13: Billy Probst
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Billy Probst', 5, '2024-08', 'My name is Billy Probst. I would like to share my experience with Mi Box. Back in May I received a phone call from my landlord with bad news. He was sick and decided to sell the house I was renting. I needed to find storage quickly and MI-BOX was there for me.', 'I needed to find storage quickly and MI-BOX was there for me', 'storage', 'Thank you Billy for leaving such a wonderful, detailed review and recognizing AJ and Illeana. Everyone one of our team members are empowered to help solve problems and we''re blessed to work with great people. We look forward to serving you in the future.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (13, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (13, 'emotional');
INSERT INTO review_tags (review_id, tag) VALUES (13, 'emergency');
INSERT INTO review_tags (review_id, tag) VALUES (13, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (13, 'locally-owned');

-- Review 14: Trey Gounah
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Trey Gounah', 5, '2024-08', 'MI-BOX has been great from the start. Quick responses, courteous drivers and fair prices.', 'Quick responses, courteous drivers and fair prices', 'both', 'Thanks for the great review Trey! We appreciate the business.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (14, 'pricing');

-- Review 15: Jamie Webley
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Jamie Webley', 5, '2024-07', 'Mi-Box was so helpful in my time of need. They made the process of getting the container delivered so simple. Then when we were done the pick up was just as seamless. I will definitely be recommending them in the future.', 'So helpful in my time of need', 'both', 'Thank you for the wonderful 5-star review Jamie! We appreciate you using our service.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (15, 'how-it-works');
INSERT INTO review_tags (review_id, tag) VALUES (15, 'emergency');

-- Review 16: Rainbow Conti
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Rainbow Conti', 5, '2024-06', 'Great service! We had not planned on having the storage box as long as we did but never once did I receive a price increase or harassment of any kind. Everyone I dealt with was super kind. Would definitely recommend over your more commercial/franchised services! Would definitely use again if the need should arise!', 'Would definitely recommend over your more commercial/franchised services!', 'storage', 'Wow! What a great review!! Thank you for taking the time to share your experience. As a small local business, we strive to provide superior service. We looking forward to working with you in the future.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (16, 'pods-comparison');
INSERT INTO review_tags (review_id, tag) VALUES (16, 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES (16, 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES (16, 'storage');

-- Review 17: Paul Wheat
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Paul Wheat', 5, '2024-06', 'Mi Box was great to work with from the start. Delivery was precise and careful. They were easy to work with regarding date changes for pick up. The pick up was also precise and careful. All the team was helpful. Ileana and AJ were my main points of contact and the contact was impeccable. Thank you for your professionalism.', 'Delivery was precise and careful', 'both', 'Thank you, Paul for the very nice review! We enjoyed working with you as well and hope you will reach out to us again if you ever need a box!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (17, 'how-it-works');
INSERT INTO review_tags (review_id, tag) VALUES (17, 'team-shoutout');

-- Review 18: Blake Quimby
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Blake Quimby', 5, '2024-05', 'This was our first time using this type of storage solution, and Mi-Box made the entire process incredibly easy. From delivery to pickup, everything was seamless. Their team was professional, friendly, and supportive throughout.', 'First time using this type of storage solution — Mi-Box made the entire process incredibly easy', 'storage', 'Thank you so much for the wonderful review Blake! We are sad to see you go but we understand. Please don''t hesitate to reach out if you need another container!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (18, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (18, 'how-it-works');
INSERT INTO review_tags (review_id, tag) VALUES (18, 'storage');

-- Review 19: Whitney Wright
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Whitney Wright', 5, '2024-04', 'Excellent service. Reasonably priced. Staff is always so helpful.', 'Excellent service. Reasonably priced.', 'both', 'Thanks for the great review Whitney! We look forward to working with you down the road.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (19, 'pricing');

-- Review 20: Allen Lai
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Allen Lai', 5, '2024-02', 'Great customer service and timely delivery and pick up.', 'Great customer service and timely delivery', 'both', 'Allen, thank you for the 5-Star review and for choosing locally owned and operated MI-BOX of Houston. It was a pleasure to work with you.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (20, 'how-it-works');

-- Review 21: Deborah Lawson
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Deborah Lawson', 5, '2024-02', 'Was a great experience. Called when they were running a little bit late, set up quickly, was able to talk to anyone when needed and picked up quickly when scheduled. Had a VERY BAD experience when dealing with POD. So glad that I found this service. Would recommend to everyone in a heart beat!', 'Had a VERY BAD experience with POD. So glad I found this service.', 'both', 'Deborah, thank you for taking the time to submit a review and your recommendation. The MI-BOX Houston team greatly appreciates your business and your feedback. We would be thrilled to work with you again in the future should the need arise.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (21, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (21, 'pods-comparison');
INSERT INTO review_tags (review_id, tag) VALUES (21, 'competitor-switch');
INSERT INTO review_tags (review_id, tag) VALUES (21, 'how-it-works');

-- Review 22: Mayra Robles
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Mayra Robles', 5, '2024-01', 'I had a fantastic experience with MiBox; everyone is extremely accommodating, from the drivers to Diana, who gave me a competitive price and went above and beyond to deliver and pick up my storage unit.', 'Everyone is extremely accommodating', 'storage', 'Thank you Mayra for the wonderful review. Being a locally owned small business we love going the extra mile for our customers.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (22, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (22, 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES (22, 'storage');

-- Review 23: Brandon Hoffart
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Brandon Hoffart', 5, '2024-01', 'I rented a unit from MI-Box and they were very helpful and easy to work with. I would use them again for my event.', 'Very helpful and easy to work with — used for my event', 'event', 'Thank you for the great review Brandon! We are glad everything worked out well for the event.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (23, 'event');

-- Review 24: Yolanda Kennedy
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Yolanda Kennedy', 5, '2024-01', 'Your awesome service fast clean very easy to get help I highly recommend Mi-Box this was just what I needed.', 'Fast, clean, very easy to get help', 'both', 'Thank very much for the 5-Star review. We appreciate you sharing your experience and choosing locally owned and operated MI-BOX of Houston.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (24, 'storage');

-- Review 25: Tina Waller
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Tina Waller', 5, '2024-01', 'I have been using a MI-Box container since December. I called on a holiday and Diana answered and sent me a quote out the same day. She explained everything and told me she and her husband were the owners. The size I wanted was out of stock but they worked with me to find a solution.', 'I called on a holiday and Diana answered and sent me a quote the same day', 'storage', 'Thank you, Tina for your business and the fabulous review. The shoutout to our team members by name means the world to each and affirms they are providing the best customer service. We truly appreciate your choosing locally owned and operated MI-BOX of Houston!', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (25, 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES (25, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (25, 'emergency');
INSERT INTO review_tags (review_id, tag) VALUES (25, 'storage');

-- Review 26: Chris Doherty
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Chris Doherty', 5, '2024-01', 'We used Mi-Box for our recent move and they were incredibly easy to work with! They were so personable on the phone and accommodating with our requests for drop-offs and pick-ups. Highly recommend and would definitely use them again.', 'Incredibly easy to work with!', 'moving', 'Thank you Chris for the wonderful review and for choosing MI-BOX!!!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (26, 'moving');
INSERT INTO review_tags (review_id, tag) VALUES (26, 'how-it-works');

-- Review 27: Diana Hallick
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Diana Hallick', 5, '2024-01', 'Excellent!! Positive: Responsiveness, Quality, Professionalism, Value', 'Responsiveness, Quality, Professionalism, Value', 'both', 'Thanks for the great review', 0, 1);

-- Review 28: Patricia Doss-Austin
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Patricia Doss-Austin', 5, '2024-01', 'I was so pleased with my delivery today of my box. Mr. Hector came in here it was uneven, he balanced it out, he took his time, he made sure it was in the right place that I can get comfortable into it and it made sure it was secure for me. I was so happy and he was very kind and very patient. Thank you.', 'He took his time and made sure it was secure for me', 'storage', 'Thank you very much for the review and for sharing your experience with our driver Hector. It means so much to the team members to hear from clients that theirs was a job well done. We appreciate you choosing locally owned and operated MI-BOX of Houston.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (28, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (28, 'how-it-works');

-- Review 29: Daniel Palacios
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Daniel Palacios', 5, '2024-01', 'Amazing company! Will recommend to my customers to get while we remodel.', 'Will recommend to my customers while we remodel', 'storage', 'Thanks, Daniel for the five star review and we will be ready the next time you need us!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (29, 'contractor');
INSERT INTO review_tags (review_id, tag) VALUES (29, 'remodeling');

-- Review 30: Erick Walker
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Erick Walker', 5, '2024-01', 'These are very clean units, creating a worry-free storage solution. They parked the container right in front of my garage so there is no hauling to a rental unit that would require a long-term contract. I would definitely rent from them again.', 'Very clean units — no hauling to a rental unit that would require a long-term contract', 'storage', 'Thank you Erick for taking the time to share your experience and for 5-Star Review. As a fairly new locally owned business, feedback is extremely valuable. We are pleased we could be of service to you.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (30, 'storage');
INSERT INTO review_tags (review_id, tag) VALUES (30, 'pricing');

-- Review 31: sperez
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('sperez', 5, '2024-01', 'Great experience! Good pricing, fast service and clear communication.', 'Good pricing, fast service and clear communication', 'both', 'Thanks for giving us a 5 star review! We look forward to serving you in the future.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (31, 'pricing');

-- Review 32: mrsmunoz A
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('mrsmunoz A', 5, '2024-01', 'If you are looking for excellence and reliability these are the right people you need. From Madonna at the office to the delivery drivers, they are the true epitome of excellence. I found this company after being stood up by another moving company.', 'I found this company after being stood up by another moving company', 'moving', 'Thank you very much for 5 star review and detailed explanation about your experience. Our team loves to be recognized for their hard work and dedication.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (32, 'competitor-switch');
INSERT INTO review_tags (review_id, tag) VALUES (32, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (32, 'moving');

-- Review 33: Robert Castillo
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Robert Castillo', 5, '2024-01', 'Excellent service. Very easy to deal with. When I was in a bind and needed an extra pod delivered at the last minute they were very accommodating and delivered the pod on Sunday their day off. Highly, highly recommend them.', 'Needed an extra pod at the last minute — they delivered on Sunday, their day off', 'both', 'Thank you Robert for the excellent review. We really do try and make every customer have a great experience as moving and home projects can be stressful. We appreciate you taking time to share your experience.', 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (33, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (33, 'emergency');
INSERT INTO review_tags (review_id, tag) VALUES (33, 'locally-owned');

-- Review 34: Razan Shurafa
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Razan Shurafa', 5, '2023-02', 'Hi, I would like to express my personal experience with MI-BOX.', NULL, 'both', 'Hi Razan, It was a pleasure working with you and thank you for the wonderful review. We are always here for you.', 0, 1);

-- Review 35: Patrick Schexnaider
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Patrick Schexnaider', 5, '2023-02', 'Madonna was very helpful. She walked me through the online process. The delivery driver was polite and professional. A highly-qualified company to work with.', 'She walked me through the online process', 'both', 'Hello Patrick. Thank you for taking the time post a review and for choosing locally owned and operated MI-BOX of Houston.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (35, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (35, 'how-it-works');

-- Review 36: Jimaniece Berry
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Jimaniece Berry', 5, '2023-02', 'Mi-Box moving and storage is absolutely amazing. Great customer service and very flexible. I ordered the wrong size box they came back out and delivered a bigger one at a discounted rate and I had to relocate my pod several times, they were always responsive and helpful.', 'I ordered the wrong size — they came back and delivered a bigger one at a discounted rate', 'both', 'Thank you for your Amazing review and for giving us the opportunity to work with you. Madonna and I enjoyed talking with you over the course of your rental and very much appreciate your choosing MI-BOX of Houston!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (36, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (36, 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES (36, 'pricing');

-- Review 37: Zcara Wiseman
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Zcara Wiseman', 5, '2023-02', 'I love the services I received from MI-Box. I can''t remember the lady name who set everything up for me but she was AWESOME her customer service was great and I had a pleasure of speaking to her when it was time for me to return the box.', 'She was AWESOME — her customer service was great', 'both', 'Hello Zcara and thank you for the great review. Madonna is the person you worked with primarily and I will share your review with her immediately.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (37, 'team-shoutout');

-- Review 38: Zachary Corson
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Zachary Corson', 5, '2023-02', 'These guys are amazing. This team went above and beyond to help us make this move easy. Highly recommend. Locally owned and very professional.', 'Locally owned and very professional', 'moving', 'Thank you for the 5 star review!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (38, 'locally-owned');
INSERT INTO review_tags (review_id, tag) VALUES (38, 'moving');

-- Review 39: Bill Bay
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Bill Bay', 5, '2023-02', 'Best service.', 'Best service', 'both', 'Thanks for the 5 star review! We appreciate your business.', 0, 1);

-- Review 40: Melinda Baumann
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Melinda Baumann', 5, '2023-02', 'Great experience and awesome service! Respectful of property. 5 stars.', 'Respectful of property', 'both', 'Thank you for the wonderful review and for trusting us with your property!', 0, 1);

-- Review 41: Luna Gorman
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Luna Gorman', 5, '2022-02', 'My moving was not an easy move in. They took a terrible situation and made it so much nicer. They were there for me when I needed them after office hours. They worked with my realtor and my realtor worked with them. The pods were clean.', 'They were there for me when I needed them after office hours', 'moving', 'Thank you Luna for the great review.', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (41, 'emergency');
INSERT INTO review_tags (review_id, tag) VALUES (41, 'moving');
INSERT INTO review_tags (review_id, tag) VALUES (41, 'emotional');

-- Review 42: Aaron Gavri
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Aaron Gavri', 5, '2022-02', 'Mike and Diane made getting a storage container quick and painless while at a great price! Can''t recommend them enough and plan to use them for all of my future moving needs!', 'Quick and painless at a great price!', 'storage', 'Aaron, thank you for your business and the positive review. We enjoyed working with you and will be here the next time you need a storage container!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (42, 'team-shoutout');
INSERT INTO review_tags (review_id, tag) VALUES (42, 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES (42, 'locally-owned');

-- Review 43: Tito
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Tito', 5, '2021-02', 'Helped me get a storage container quick and easy and at a good price.', 'Quick and easy at a good price', 'storage', 'Tito, thanks for working with us and we are glad we could help on short notice. Thanks for the positive review!', 0, 1);
INSERT INTO review_tags (review_id, tag) VALUES (43, 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES (43, 'storage');

-- Review 44: Julie Davis
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Julie Davis', 5, '2021-02', 'Positive: Responsiveness, Quality, Professionalism, Value', NULL, 'both', 'Thanks for the review Julie. It was a pleasure working with you and your husband.', 0, 1);

-- Review 45: Jonathan Prifan (existing homepage testimonial)
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Jonathan Prifan', 5, '2024-08', 'I would recommend 10/10 times! Mike and his team made our move so much easier. The container was clean, delivery was on time, and the price was unbeatable.', 'I would recommend 10/10 times!', 'moving', NULL, 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (45, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (45, 'moving');
INSERT INTO review_tags (review_id, tag) VALUES (45, 'pricing');
INSERT INTO review_tags (review_id, tag) VALUES (45, 'team-shoutout');

-- Review 46: Michael Siegel (existing homepage testimonial)
INSERT INTO reviews (reviewer_name, rating, review_date, review_text, review_snippet, service_type, owner_response, is_featured, is_active)
VALUES ('Michael Siegel', 5, '2024-08', 'Service, responsiveness and communication were excellent. The unit was clean, sturdy, and seems to be of a higher quality than the others I''ve used. Would use again!', 'Service, responsiveness and communication were excellent', 'both', NULL, 1, 1);
INSERT INTO review_tags (review_id, tag) VALUES (46, 'homepage');
INSERT INTO review_tags (review_id, tag) VALUES (46, 'pods-comparison');
