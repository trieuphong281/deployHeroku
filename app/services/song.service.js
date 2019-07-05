const config = require('../configs/config.json');
const mongoose = require('mongoose');
const db = require('../helpers/db');
const { google } = require('googleapis');
const Song = db.Song;
const User = db.User;

module.exports = {
    add,
    search,
    vote
};

async function add({ id }, username) {
    const user = await User.findOne({ username });
    if (user.songAdd === 0) {
        return 'Already used Add';
    } else {
        let service = google.youtube('v3');
        try {
            const searchResults = await service.videos.list({
                auth: 'AIzaSyCiMzEh7Qbm55R7JxcugLkuLTBzWVuLrEg',
                part: 'snippet',
                id: id
            });
            let videoItem = searchResults.data.items[0];
            if (videoItem.length == 0) {
                return 'No Video Found';
            } else {
                let song = new Song({
                    videoId: videoItem.id,
                    title: videoItem.snippet.title,
                    channelTitle: videoItem.snippet.channelTitle,
                    thumbnails: videoItem.snippet.thumbnails.medium.url,
                });
                await song.save();
                user.songAdd = 0;
                await user.save();
                return 'Successfully Added';
            }
        }
        catch (error) {
            return error;
        }
    }

}
// processing
async function search(query) {
    let service = google.youtube('v3');
    try {
        const searchResults = await service.search.list({
            auth: 'AIzaSyCiMzEh7Qbm55R7JxcugLkuLTBzWVuLrEg',
            part: 'snippet',
            q: query,
            videoCategoryId: '10',
            type: 'video',
            videoEmbeddable: true,
            order: 'viewcount'
        });
        let videolist = searchResults.data.items;
        if (videolist.length == 0) {
            return 'No Video Found';
        } else {
            const filtered = await filterVideoResult(videolist);
            return filtered;
        }
    }
    catch (error) {
        return next(error);
    }
}

async function vote({ video_id, isUpvote }, username) {   // video_id : id in DB, not in Youtube
    mongoose.set('useFindAndModify', false);
    try {
        const votingUser = await User.findOne({ username });
        console.log(votingUser.username);
        if (votingUser.vote > 0) {
            const userDecreaseVote = await User.findOneAndUpdate({ username: username }, { $inc: { vote: -1 } });
            if (userDecreaseVote) {
                await Song.findOneAndUpdate({ _id: mongoose.Types.ObjectId(video_id) }, { $inc: isUpvote === true ? { upvote: 1 } : { downvote: 1 } });
                return { status: '201', Message: `Successfully voted!!!` };
            }
        }
        else {
            return { status: '202', Message: 'Out of vote!!!' }
        }
    }
    catch (error) {
        return ({
            status: '202', Message: error
        });
    }
}

async function filterVideoResult(videolist) {
    let filterdList = [];
    videolist.forEach(item =>
        filterdList.push( {
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnails: item.snippet.thumbnails.medium.url,
        })
    )
    return filterdList;
}