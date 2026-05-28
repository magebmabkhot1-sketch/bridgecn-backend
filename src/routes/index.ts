import { Router } from 'express';
import auth from './auth';
import waitlist from './waitlist';
import universities from './universities';
import students from './students';
import messages from './messages';
import events from './events';
import posts from './posts';
import profile from './profile';

const router = Router();

router.use('/auth', auth);
router.use('/waitlist', waitlist);
router.use('/universities', universities);
router.use('/students', students);
router.use('/messages', messages);
router.use('/events', events);
router.use('/posts', posts);
router.use('/profile', profile);

export default router;
