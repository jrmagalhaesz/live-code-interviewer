import { useEffect, useState } from "react";

//Import services
import getRecordings from "../services/getRecording";
import requestGenerateTranscript from "../services/requestGenerateTranscript";
import getTranscript from "../services/getTranscript";
import getQuestions from "../services/reportGetQuestions";
import getActionItems from "../services/reportGetActionItens";
import getFollowUps from "../services/reportGetFollowUps";
import getTopics from "../services/reportGetTopics";
import getSummary from "../services/reportGetSummary";
import CollapsibleText from "../components/CollapsibleText";

//Import components
import ReportActionItemComponent from "../components/ReportActionItemComponent";

const InterviewReportComponent = () => {
  // Main identifiers, for the room and the record
  const [roomId, setRoomId] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

  // Data of the interviews
  const [interviewsDataList, setInterviewsDataList] = useState<any | null>(null);
  const [selectedInterviewData, setSelectedInterviewData] = useState<any | null>(null);

  // Data of the selected interview
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [meetingTranscript, setMeetingTranscript] = useState<string>(
    "Waiting for transcription...(if it's the first time here, it could take up to 20 minutes). Try again later, reload the page or check the debug section."
  );
  const [actionItens, setActionItens] = useState([{ text: "Loading..." }]);
  const [followUps, setFollowUps] = useState([{ text: "Loading..." }]);
  const [questionsReport, setQuestionsReport] = useState([{ text: "Loading..." }]);
  const [topics, setTopics] = useState([{ text: "Loading..." }]);
  const [summary, setSummary] = useState([{ text: "Loading..." }]);

  // TODO: update the transcription collapsable based on the status
  // const [transcriptStatus, setTranscriptStatus] = useState<number | null>(null);
  // 409 - loading; 404 - error;

  // Execute on first render
  useEffect(() => {
    // Get the URL params
    const params = new URLSearchParams(window.location.search);
    setRoomId(params.get("roomId"));
  }, []);

  // Execute when the roomId changes
  useEffect(() => {
    // Execute when the roomId changes
    async function getInterviewsDataList(room_id: string | null) {
      console.log("Requesting interviews data list...");
      try {
        const request = await getRecordings();
        const filteredData = request.data.filter((recording: any) => recording.roomId == room_id);
        setInterviewsDataList(filteredData);
      } catch (error) {
        console.error("Error getting interviews data list: ", error);
      }
    }
    getInterviewsDataList(roomId);
  }, [roomId]);

  //Exectue when the interviewsDataList changes
  useEffect(() => {
    if (!interviewsDataList) {
      console.log("Interviews data list not available");
      return;
    }
    // Set the selectedInterviewData to the first interview
    setSelectedInterviewData(interviewsDataList[0]);
  }, [interviewsDataList]);

  // Execute when the selectedInterviewData changes - From the select view, for example
  useEffect(() => {
    if (!selectedInterviewData) {
      console.log("Interview data not available");
      return;
    }

    // Set the recordId and Video URL to the selectedInterviewData
    setRecordId(selectedInterviewData.uuid);
    console.log("selectedInterviewData", selectedInterviewData);
    setVideoURL(selectedInterviewData.url);
    console.log("Video URL", selectedInterviewData.url);
  }, [selectedInterviewData]);

  // Execute when the recordId changes - From the select view, but after the video URL and interview UUID is set
  useEffect(() => {
    if (!recordId) {
      console.log("Record ID not available");
      return;
    }
    console.log("Requesting transcript for interview ", recordId);

    //Function for transform into human format the transcript
    function transformTranscriptIntoHumanFormat(transcriptBrute: any) {
      let transcript = "";
      transcriptBrute.forEach((element: any) => {
        transcript +=
          new Date(element.startTime).toUTCString() +
          " - " +
          element.username +
          ": " +
          element.content +
          "\n";
      });
      return transcript;
    }

    // First it tries to get the transcript for all the interviews, if it fails, it requests all the transcripts
    interviewsDataList.forEach((interview: any) => {
      getTranscript(interview.uuid)
        .then((transcript) => {
          console.log("Transcript for interview ", interview.uuid, ": VALID!");

          // but shows only the selected interview transcript
          if (interview.uuid == recordId) {
            setMeetingTranscript(transformTranscriptIntoHumanFormat(transcript));
          }
        })
        .catch((error) => {
          console.error("Error getting transcript for interview ", interview.uuid, ": ", error);
          console.log("Requesting transcript for interview ", interview.uuid);
          requestGenerateTranscript(interview.uuid)
            .then(() => console.log("Transcript requested for interview ", interview.uuid))
            .catch((error) =>
              console.error(
                "Error generating transcript request for interview ",
                interview.uuid,
                ": ",
                error
              )
            );
        });
    });

    // Get the action itens
    getActionItems(recordId)
      .then((actionItens) => {
        console.log("Action itens for interview", recordId, ": VALID!");
        setActionItens(actionItens);
      })
      .catch((error) => {
        console.error("Error getting action itens for interview ", recordId, ": ", error);
      });

    // Get the follow-ups
    getFollowUps(recordId)
      .then((followUps) => {
        console.log("Follow-ups for interview", recordId, ": VALID!");
        setFollowUps(followUps);
      })
      .catch((error) => {
        console.error("Error getting follow-ups for interview ", recordId, ": ", error);
      });

    // Get the questions
    getQuestions(recordId)
      .then((questions) => {
        console.log("Questions for interview", recordId, ": VALID!");
        setQuestionsReport(questions);
      })
      .catch((error) => {
        console.error("Error getting questions for interview ", recordId, ": ", error);
      });

    // Get the topics
    getTopics(recordId)
      .then((topics) => {
        console.log("Topics for interview", recordId, ": VALID!");
        setTopics(topics);
      })
      .catch((error) => {
        console.error("Error getting topics for interview ", recordId, ": ", error);
      });

    // Get the summary
    getSummary(recordId)
      .then((summary) => {
        console.log("Summary for interview", recordId, ": VALID!");
        setSummary(summary);
      })
      .catch((error) => {
        console.error("Error getting summary for interview ", recordId, ": ", error);
      });
  }, [recordId]);

  return (
    <>
      <div>
        {/* Title and recordings selector */}
        <h3>Room - {roomId}</h3>
        Room Id:
        <input
          type="text"
          value={roomId || ""}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
        />
        {interviewsDataList && (
          <>
            - Record Id:
            <select
              onChange={(e) => {
                console.log("selectedInterviewData", e.target.value);
                setSelectedInterviewData(
                  interviewsDataList.find((interview: any) => interview.uuid === e.target.value)
                );
              }}
              value={recordId || ""}>
              <option value="" disabled>
                Select an interview
              </option>
              {interviewsDataList.map((interview: any) => (
                <option key={interview.uuid} value={interview.uuid}>
                  {new Date(interview.createdAt).toUTCString()} - {interview.uuid}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Interview Video */}
      <CollapsibleText title="Interview Video">
        {videoURL ? (
          <video controls width="1000">
            <source src={videoURL} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p>Video not available</p>
        )}
      </CollapsibleText>

      {/* TODO: The source code typed on the interview here */}

      {/* Meeting Transcript */}
      <CollapsibleText title="Meeting transcript">
        <textarea value={meetingTranscript} readOnly={true} style={{ width: 1000, height: 200 }} />
      </CollapsibleText>

      {/* Action itens */}
      <CollapsibleText title="Action itens">
        {actionItens.map((actionItem: any) => (
          <ReportActionItemComponent text={actionItem.text} />
        ))}
      </CollapsibleText>

      {/* Follow-ups */}
      <CollapsibleText title="Follow-ups">
        {followUps.map((followUp: any) => (
          <p>{followUp.text}</p>
        ))}
      </CollapsibleText>

      {/* Questions */}
      <CollapsibleText title="Questions">
        {questionsReport.map((question: any) => (
          <p>{question.text}</p>
        ))}
      </CollapsibleText>

      {/* Topics */}
      <CollapsibleText title="Topics">
        {topics.map((topic: any) => (
          <p>{topic.text}</p>
        ))}
      </CollapsibleText>

      {/* Summary */}
      <CollapsibleText title="Summary">
        {summary.map((summaryItem: any) => (
          <p>{summaryItem.text}</p>
        ))}
      </CollapsibleText>
    </>
  );
};

export default InterviewReportComponent;
