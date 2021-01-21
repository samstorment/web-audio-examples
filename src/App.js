import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import { BypassWorklet } from "./BypassWorklet";
import { MediaRecorderAPI } from "./MediaRecorderAPI";
import { Recorder } from "./recorder-worklet/Recorder";
import { RecordRTCRecorder } from "./RecordRTC";
import { ToneJs } from "./ToneJs";
import { WebAudioAPI } from "./WebAudioAPI";

export const App = () => (
    <BrowserRouter>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px", border: "1px solid black"}}>
            <Link to="/tone-js">Tone Js</Link>
            <Link to="/media-recorder">Media Recorder API</Link>
            <Link to="/web-audio-api">Web Audio API</Link>
            <Link to="/record-rtc">Record RTC</Link>
            <Link to="/bypass-worklet">Bypass Worklet</Link>
            <Link to="/recorder-worklet">Recorder Worklet</Link>
        </div>
        <Switch>
            <Route exact path="/tone-js" component={ToneJs} />
            <Route exact path="/media-recorder" component={MediaRecorderAPI} />
            <Route exact path="/web-audio-api" component={WebAudioAPI} />
            <Route exact path="/record-rtc" component={RecordRTCRecorder} />
            <Route exact path="/bypass-worklet" component={BypassWorklet} />
            <Route exact path="/recorder-worklet" component={Recorder} />
        </Switch>
    </BrowserRouter>
)