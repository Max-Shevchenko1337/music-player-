const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_KEY = "MY_PLAYER";
const musicName = $(".music-player .music-name");
const musicArtist = $(".music-player .music-artist");
const cd = $(".cd");
const cdThumb = $(".music-player .cd-thumb");
const audio = $(".music-player #audio");
const playButton = $(".music-player .play");
const progressBar = $(".music-player .progress-bar");
const nextButton = $(".music-player .play-skip-forward");
const prevButton = $(".music-player .play-skip-back");
const shuffleButton = $(".music-player .btn-shuffle");
const repeatButton = $(".music-player .btn-repeat");
const playList = $(".music-player .play-list");
const durationSongTime = $(".music-player .timer .duration");
const songTime = $(".music-player .timer .song-time");

const app = {
	currentIndex: 0,
	isShuffle: false,
	isRepeat: false,
	playedRandomIndex: [],
	config: JSON.parse(localStorage.getItem(PLAYER_KEY)) || {},
	songs: [
		{
			name: "Demons",
			artist: "Imagine Dragons",
			img: "./assets/img/Imagine Dragons - Demons.jpg",
			src: "./assets/music/Imagine Dragons - Demons.mp3",
		},
		{
			name: "Believer",
			artist: "Imagine Dragons",
			img: "./assets/img/Imagine Dragons - Believer.jpg",
			src: "./assets/music/Imagine Dragons - Believer.mp3",
		},
		{
			name: "Birds",
			artist: "Imagine Dragons",
			img: "./assets/img/Imagine Dragons - Birds.jpg",
			src: "./assets/music/Imagine Dragons - Birds.mp3",
		},
		{
			name: "Radioactive",
			artist: "Imagine Dragons",
			img: "./assets/img/Imagine Dragons - Radioactive.jpg",
			src: "./assets/music/Imagine Dragons - Radioactive.mp3",
		},
	],
	setConfig(key, value) {
		this.config[key] = value;
		localStorage.setItem(PLAYER_KEY, JSON.stringify(this.config));
	},
	render() {
		const htmls = this.songs.map((song, index) => {
			return `
                <div class="song ${
					index == this.currentIndex ? "active" : ""
				}" data-index="${index}">
                    <div class="thumb">
                        <img src="${song.img}" alt="">
                    </div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.artist}</p>
                    </div>
                    <div class="option">
                        <ion-icon name="ellipsis-vertical-outline"></ion-icon>
                    </div>
                </div>
            `;
		});

		playList.innerHTML = htmls.join("");
	},
	formatTime(number) {
		const hours = Math.floor(number / 3600);
		const minutes = Math.floor(number / 60);
		const seconds = Math.floor(number % 60);

		return `${hours > 0 ? `${hours}:` : ""}${
			minutes < 10 ? `0${minutes}` : minutes
		}:${seconds < 10 ? `0${seconds}` : seconds}`;
	},
	defineProperties() {
		Object.defineProperty(this, "currentSong", {
			get() {
				return this.songs[this.currentIndex];
			},
		});
	},
	handleEvents() {
		const cdWidth = cd.offsetWidth;

		// handle cdThumb rotate
		const cdThumbAnimation = cdThumb.animate(
			[{ transform: "rotate(360deg)" }],
			{
				duration: 10000,
				iterations: Infinity,
			}
		);
		cdThumbAnimation.pause();

		// handle zoom in/out CD when scroll
		document.onscroll = () => {
			const scrollTop =
				window.scrollY || document.documentElement.scrollTop;
			const newCdWidth = cdWidth - scrollTop;

			cd.style.width = newCdWidth > 0 ? `${newCdWidth}px` : 0;
			cd.style.opacity = newCdWidth / cdWidth;
		};

		// handle play/pause music
		playButton.onclick = () => {
			if (audio.paused) {
				audio.play();
			} else {
				audio.pause();
			}
		};

		// effect when audio play
		audio.onplay = () => {
			cdThumbAnimation.play();
			playButton.innerHTML = '<ion-icon name="pause-outline"></ion-icon>';
		};

		// effect when audio pause
		audio.onpause = () => {
			cdThumbAnimation.pause();
			playButton.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
		};

		// handle progress bar
		audio.ontimeupdate = () => {
			if (audio.duration) {
				const percent = (audio.currentTime / audio.duration) * 100;
				progressBar.value = percent;

				durationSongTime.textContent = this.formatTime(audio.currentTime);
				songTime.textContent = this.formatTime(audio.duration);
			}
		};

		// handle oninput progress bar
		progressBar.oninput = (e) => {
			const percent = e.target.value;
			audio.currentTime = (audio.duration / 100) * percent;
		};

		// handle next song
		nextButton.onclick = () => {
			if (this.isShuffle) {
				this.shuffleSong();
			} else {
				this.nextSong();
			}

			audio.play();
			this.scrollToActiveSong();
		};

		// handle prev song
		prevButton.onclick = () => {
			if (this.isShuffle) {
				this.shuffleSong();
			} else {
				this.prevSong();
			}

			audio.play();
			this.scrollToActiveSong();
		};

		// handle click shuffle
		shuffleButton.onclick = () => {
			this.isShuffle = !this.isShuffle;
			this.setConfig("isShuffle", this.isShuffle);
			shuffleButton.classList.toggle("active", this.isShuffle);
		};

		// handle click repeat
		repeatButton.onclick = () => {
			this.isRepeat = !this.isRepeat;
			this.setConfig("isRepeat", this.isRepeat);
			repeatButton.classList.toggle("active", this.isRepeat);
		};

		// handle when audio ended
		audio.onended = () => {
			if (this.isShuffle) {
				this.shuffleSong();
				audio.play();
			} else if (this.isRepeat) {
				audio.play();
			} else {
				nextButton.click();
			}
		};

		// handle click play list
		playList.onclick = (e) => {
			if (
				e.target.closest(".song:not(.active)") ||
				e.target.closest(".option")
			) {
				if (e.target.closest(".option")) {
				} else {
					this.currentIndex = e.target.closest(".song").dataset.index;
					this.loadCurrentSong();
					audio.play();
				}
			}
		};
	},
	loadCurrentSong() {
		musicName.textContent = this.currentSong.name;
		musicArtist.textContent = this.currentSong.artist;
		cdThumb.style.backgroundImage = `url('${this.currentSong.img}')`;
		audio.src = this.currentSong.src;

		// init duration and song time
		audio.onloadedmetadata = () => {
			durationSongTime.textContent = this.formatTime(audio.currentTime);
			songTime.textContent = this.formatTime(audio.duration);
		};

		this.activeSong();
	},
	loadConfig() {
		this.isShuffle = this.config.isShuffle ?? false;
		this.isRepeat = this.config.isRepeat ?? false;

		shuffleButton.classList.toggle("active", this.isShuffle);
		repeatButton.classList.toggle("active", this.isRepeat);
	},
	nextSong() {
		this.currentIndex++;

		if (this.currentIndex >= this.songs.length) {
			this.currentIndex = 0;
		}

		this.loadCurrentSong();
	},
	prevSong() {
		this.currentIndex--;

		if (this.currentIndex < 0) {
			this.currentIndex = this.songs.length - 1;
		}

		this.loadCurrentSong();
	},
	shuffleSong() {
		let newIndex;

		const randomNumber = () => {
			return Math.floor(Math.random() * this.songs.length);
		};

		do {
			newIndex = randomNumber();
		} while (
			this.playedRandomIndex.includes(newIndex) &&
			this.playedRandomIndex.length < this.songs.length
		);

		if (this.playedRandomIndex.length < this.songs.length) {
			this.playedRandomIndex.push(newIndex);
		} else {
			// reset index
			while (this.currentIndex == newIndex) {
				newIndex = randomNumber();
			}

			this.playedRandomIndex = [this.currentIndex, newIndex];
		}

		this.currentIndex = newIndex;
		this.loadCurrentSong();
	},
	activeSong() {
		const songs = $$(".play-list .song");

		songs.forEach((song, index) => {
			song.classList.remove("active");
		});

		if (songs[this.currentIndex]) {
			songs[this.currentIndex].classList.add("active");
		}
	},
	scrollToActiveSong() {
		setTimeout(() => {
			const scrollSong = $(".play-list .song.active");

			if (this.currentIndex < 2) {
				scrollSong.scrollIntoView({
					behavior: "smooth",
					block: "end",
				});
			} else {
				scrollSong.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			}
		}, 300);
	},
	start() {
		this.loadConfig();
		this.defineProperties();
		this.handleEvents();
		this.loadCurrentSong();
		this.render();
	},
};

app.start();
