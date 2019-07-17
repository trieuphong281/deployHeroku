﻿const config = require('../configs/config.json');
const mongoose = require('mongoose');
const db = require('../helpers/db');
const { google } = require('googleapis');
const timeChecker = require('../helpers/timechecker');
const Song = db.Song;
const User = db.User;

module.exports = {
    addSongToList,
    searchSongs,
    voteASong,
    getPlaylist,
    isAfterScheduleTime,
    resetSongCollection
};

async function addSongToList({ id }, username) {
    const user = await User.findOne({ username });
    if (user.songAdd === 0) {
        return {
            status: 400,
            message: 'Already used Add'
        };
    } else {
        let service = google.youtube('v3');
        try {
            const searchResults = await service.videos.list({
                auth: config.youtubeApiKEY,
                part: 'snippet,contentDetails',
                id: id
            });
            let videoItem = searchResults.data.items[0];
            if (videoItem.length == 0) {
                return {
                    status: 200,
                    message: 'No video found'
                };
            } else {
                let song = new Song({
                    videoId: videoItem.id,
                    title: videoItem.snippet.title,
                    channelTitle: videoItem.snippet.channelTitle,
                    thumbnails: videoItem.snippet.thumbnails.medium.url,
                    addedUser: username,
                    duration: convert_time(videoItem.contentDetails.duration)
                });
                await song.save();
                user.songAdd = 0;
                await user.save();
                return {
                    status: 200,
                    message: 'Sucessfully Added'
                };
            }
        }
        catch (error) {
            return {
                status: 400,
                message: error
            };
        }
    }

}
async function searchSongs(searchName, pagesToken) {
    let service = google.youtube('v3');
    try {
        const searchResults = await service.search.list({
            auth: config.youtubeApiKEY,
            part: 'snippet',
            type: 'video',
            videoEmbeddable: true,
            maxResults: 10,
            pageToken: pagesToken,
            videoCategoryId: '10',
            q: searchName
        });
        let videolist = searchResults.data.items;
        if (videolist.length == 0) {
            return {
                status: 200,
                message: 'No video found'
            };
        } else {
            const filteredListVideo = await filterVideoResult(videolist);
            return {
                status: 200,
                message:
                {
                    nextPage: searchResults.data.nextPageToken,
                    previousPage: searchResults.data.prevPageToken,
                    data: filteredListVideo
                }
            };
        }
    }
    catch (error) {
        return {
            status: 400,
            message: error
        }
    }
}

async function voteASong({ video_id, isUpvote }, username) {   // video_id : id in DB, not in Youtube
    mongoose.set('useFindAndModify', false);
    try {
        const votingUser = await User.findOne({ username });
        if (votingUser.vote > 0) {
            await User.findOneAndUpdate({ username: username }, { $inc: { vote: -1 } });
            await Song.findOneAndUpdate({ _id: mongoose.Types.ObjectId(video_id) }, { $inc: isUpvote === true ? { upvote: 1 } : { downvote: 1 } });
            return { status: 200, message: `Successfully voted!!!` };
        }
        else {
            return {
                status: 400,
                message: 'Out of vote!!!'
            }
        }
    }
    catch (error) {
        return ({
            status: 400,
            Message: error
        });
    }
}
async function getSong(videoId) {
    let service = google.youtube('v3');
    try {
        const searchResults = await service.videos.list({
            auth: config.youtubeApiKEY,
            part: 'snippet,contentDetails',
            id: videoId
        });
        if (searchResults.data.items.length === 0) {
            return {
                status: 200,
                message: 'No Video Found'
            };
        } else {
            let videoItem = searchResults.data.items[0];
            let song = new Song({
                videoId: videoItem.id,
                title: videoItem.snippet.title,
                channelTitle: videoItem.snippet.channelTitle,
                thumbnails: videoItem.snippet.thumbnails.medium.url,
                duration: convert_time(videoItem.contentDetails.duration)
            });
            return {
                status: 200,
                message: song
            }
        }
    }
    catch (error) {
        return {
            status: 400,
            message: "Error in search API " + error
        };
    }
}

async function filterVideoResult(videolist) {
    let filterdList = videolist.map(item => {
        return {
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnails: item.snippet.thumbnails.medium.url
        }
    });
    return filterdList;
}

async function getPlaylist() {
    try {
        const playList = await Song.find({});
        if (playList.length > 0) {
            let sortedList = playList.sort(function (a, b) {
                return (b.upvote - b.downvote) - (a.upvote - a.downvote);
            });
            return {
                status: 200,
                message: sortedList
            };
        }
        else {
            return {
                status: 200,
                message: "There is no song in the play list now!"
            };
        }
    }
    catch (error) {
        return {
            status: 400,
            message: "Error" + error
        };
    }
}

// async function removeFinishedSong({ video_id }) {
//     try {
//         const removeResult = await Song.deleteOne({ _id: mongoose.Types.ObjectId(video_id) });
//         if (removeResult)
//             return {
//                 status: 200,
//                 message: "Remove song succesfully!"
//             };
//         else
//             return {
//                 status: 400,
//                 message: "Failed to remove song!"
//             };
//     }
//     catch (error) {
//         return {
//             status: 400,
//             message: error
//         };
//     }
// }

function convert_time(duration) {
    let a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
        a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
        a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
        duration = duration + parseInt(a[0]) * 3600;
        duration = duration + parseInt(a[1]) * 60;
        duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
        duration = duration + parseInt(a[0]) * 60;
        duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
        duration = duration + parseInt(a[0]);
    }
    return duration;
}

function isAfterScheduleTime() {
    return timeChecker.isAfter();
}
async function resetSongCollection() {
    try {
        await Song.deleteMany({});
        return {
            status: ok,
            message: "Successfully Reset Song!!!"
        };
    }
    catch (error) {
        return {
            status: failed,
            message: error
        };
    }
}