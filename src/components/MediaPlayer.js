import React, { useRef, useEffect, useState } from "react";
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,} from "./ui/select"
import { Play, Pause } from "lucide-react"

function MediaPlayer() {

  // Set variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState([0]);
  const [timestamp, setTimestamp] = useState('');
  const [focusOn, setFocusOn] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sliderRef = useRef(null);

  var video = null;
  var canvas = null;
  var ctx = null;
  var totalDuration = null;
  var red = useRef(255);
  var green = useRef(0);
  var blue = useRef(0);
  var threshold = useRef(200);

  // Set variables and start rendering
  useEffect(() => {
    video = videoRef.current;
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    applyFocusPeak();
  }, []);

  // Turn Focus Peaking On/Off
  function toggleFocus(){
    if (focusOn) {
      canvasRef.current.style.visibility = "hidden";
    }
    else {
      canvasRef.current.style.visibility = "visible";
    }
    setFocusOn(!focusOn);
  }

  // Sync Slider position with Video Time
  function syncVideo(value){
    videoRef.current.currentTime = value[0]/100 * videoRef.current.duration;
  }

  // Convert Slider position to Time
  function decToTime(decimal){
    decimal = Math.floor(decimal)
    let minutes = Math.floor(decimal/60);
    let seconds = decimal%60;
    if (seconds < 10){
      seconds = "0" + seconds;
    }
    return minutes + ":" + seconds;
  }

  // Set Focus Peaking Strength
  function changeStrength(value){
    if (value === "low"){
      threshold.current = 500;
    }
    else if (value === "normal"){
      threshold.current = 200;
    }
    else {
      threshold.current = 100;
    }
  }

  // Set Focus Peaking Color
  function changeColor(value){
    if (value === "red"){
      red.current = 255;
      green.current = 0;
      blue.current = 0;
    }
    else if (value === "green"){
      red.current = 0;
      green.current = 255;
      blue.current = 0;
    }
    else{
      red.current = 0;
      green.current = 0;
      blue.current = 255;
    }
  }

  // Play/Pause Video
  function togglePlayPause() {
    if (isPlaying) {
      videoRef.current.pause();  // Pause the video
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);    // Toggle the play/pause state
  }

  // Apply Sobel Filter to Video
  function sobelFilter(imageData){

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Sobel Kernels
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];

    const sobelY = [
      [-1, -2, -1],
      [0,  0,  0],
      [1,  2,  1]
    ];


    const output = new Uint8ClampedArray(data.length);

    // Apply Filter to each pixel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gradientX = 0;
        let gradientY = 0;

        // Apply Filter to neighboring pixels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const pixel = [
              data[pixelIndex],   // Red
              data[pixelIndex + 1], // Green
              data[pixelIndex + 2]  // Blue
            ];

            gradientX += pixel[0] * sobelX[ky + 1][kx + 1];
            gradientY += pixel[0] * sobelY[ky + 1][kx + 1];
          }
        }

        // Calculate Gradient Magnitude
        const magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        
        const outputIndex = (y * width + x) * 4;

        // Set the Pixel Color if past threshold
        if (magnitude > threshold.current){
          output[outputIndex] = red.current;         // Red
          output[outputIndex + 1] = green.current;     // Green
          output[outputIndex + 2] = blue.current;   // Blue
          output[outputIndex + 3] = 255;
        }
      }
    }

    return new ImageData(output, width, height);
  }

  // Render Canvas with Focus Peaking
  function applyFocusPeak() {
    if (video && canvas && ctx) {
      // Set Canvas Size to Video Size when loaded
      video.onloadedmetadata = () => {
        totalDuration = ' / ' + decToTime(video.duration);
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
      }

      if (totalDuration != null){
        setTimestamp(decToTime(videoRef.current.currentTime) + totalDuration);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data from the Canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
      // Apply Sobel Filter
      const sobelImage = sobelFilter(imageData);
      
      // Sync Slider with Video Time
      setSliderValue([videoRef.current.currentTime/videoRef.current.duration * 100]);

      // Draw processed image to Canvas
      ctx.putImageData(sobelImage, 0, 0);
    
      // Continue drawing each frame
      requestAnimationFrame(applyFocusPeak);
    }
  }

  return (
    <div>
      <div className="menu-options">
        <div className="menu-group text-sm font-medium">
          Strength: 
          <Select defaultValue={"normal"} onValueChange={changeStrength}>
            <SelectTrigger className="dropdown">
              <SelectValue placeholder="Select Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="menu-group text-sm font-medium">
          Color: 
          <Select defaultValue={"red"} onValueChange={changeColor}>
            <SelectTrigger className="dropdown">
              <SelectValue placeholder="Select Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="menu-group text-sm font-medium">
          <Checkbox id="toggleFocus" checked={focusOn} onCheckedChange={toggleFocus}/>
          <label htmlFor="toggleFocus">
            Toggle Focus Peaking
          </label>
        </div>
      </div>
      <div className="video-container">
        <video ref={videoRef} onPlay={applyFocusPeak}>
          <source src="/videos/exploreHD-Focus.mp4" type="video/mp4" />
        </video>
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none"}} />
      </div>
      <div className="video-controls">
        <Button onClick={togglePlayPause} size="sm">{isPlaying ? (
            <Pause fill="white"/>
          ) : (
            <Play fill="white"/>
          )}
        </Button>
        <Slider className="videoSlider" ref={sliderRef} value={sliderValue} max={100} step={1} onValueChange={syncVideo}/>
        <div className="text-sm font-medium">{timestamp}</div>
      </div>
    </div>
  );
};

export default MediaPlayer;