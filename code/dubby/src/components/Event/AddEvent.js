import React, { useState, useEffect, useContext } from "react";
import { Link, Redirect } from "react-router-dom";
import { GymContext } from "../../contexts/GymContext";
import { UserContext } from "../../contexts/UserContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { EventTypeContext } from "../../contexts/EventTypeContext";
import {
  Jumbotron,
  Alert,
  Form,
  FormGroup,
  Label,
  Input,
  Col,
  Row,
  Button,
} from "reactstrap";
import Navbar from "../Navbar/Navbar";
import Loading from "../Loading/Loading";
import { setupFirestoreForNewEvent } from "../../utilityfunctions/Utilities";

// calculates current date and returns iso string
const calculateDate = () => {
  const date = new Date(Date.now());
  const dateLocal = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000
  );
  return dateLocal.toISOString().substr(0, 10);
};

// calculates current time and returns iso string
const calculateTime = () => {
  const date = new Date(Date.now());
  const dateLocal = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000
  );
  return dateLocal.toISOString().substr(11, 5);
};

const AddEvent = () => {
  const { theme } = useContext(ThemeContext);
  const { gymData } = useContext(GymContext);
  const { eventTypeData } = useContext(EventTypeContext);
  const { userData } = useContext(UserContext);

  // data to be submitted
  const [allowedPeople, setAllowedPeople] = useState();
  const [eventName, setEventName] = useState();
  const [eventType, setEventType] = useState();
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState();
  const [startingTime, setStartingTime] = useState();
  // input date and time
  const [eventStartingDate, setEventStartingDate] = useState(calculateDate());
  const [eventStartingTime, setEventStartingTime] = useState(calculateTime());
  // boolean whether data is being submitted, will render loading when true
  const [submittingEventData, setSubmittingEventData] = useState(false);
  // message for top alert
  const [errorMessage, setErrorMessage] = useState();
  // when event submitted, will redirect to event based on value of eid
  const [eventSubmittedEid, setEventSubmittedEid] = useState(false);

  // calculate starting time from inputs eventStartingDate and eventStartingTime
  // updates eventStartingTime
  useEffect(() => {
    setStartingTime(
      new Date(eventStartingDate + "T" + eventStartingTime + ":00").getTime()
    );
  }, [eventStartingDate, eventStartingTime]);

  // loads event location data from gymData and
  // updates location
  useEffect(() => {
    if (gymData) {
      setLocation(gymData[0].value);
    }
  }, [gymData]);

  // loads event type data from eventTypeData and
  // updates eventType
  useEffect(() => {
    if (eventTypeData) {
      setEventType(eventTypeData[0].value);
    }
  }, [eventTypeData]);

  // checks starting time, whether all fields are filled
  // then creates new event in database
  // finally sets eventSubmittedEid for redirection
  // updates errorMessage, submittingEventData, eventSubmittedEid
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (startingTime < Date.now()) {
      setErrorMessage(
        "Chill, man. You need to give people some time to prep for this event!"
      );
    } else {
      if (userData && allowedPeople && eventName && eventType && location) {
        setErrorMessage("Submitting...");
        setSubmittingEventData(true);
        const eventData = {
          allowedPeople,
          eventName,
          eventType,
          isPublic,
          location,
          startingTime,
        };
        const eid = await setupFirestoreForNewEvent(eventData);
        setSubmittingEventData(false);
        setEventSubmittedEid(eid);
      } else {
        setErrorMessage("Please fill in all data!");
      }
    }
  };

  // render
  if (!gymData || !eventTypeData || submittingEventData) {
    return <Loading />;
  } else if (eventSubmittedEid) {
    return <Redirect to={`/e/${eventSubmittedEid}`} />;
  } else {
    return (
      <div style={theme.background}>
        <Navbar />
        <Jumbotron style={theme.jumbotron}>
          <h1>Create a new event!</h1>
        </Jumbotron>
        <Form onSubmit={handleEventSubmit} style={{ padding: "1rem" }}>
          {errorMessage && <Alert>{errorMessage}</Alert>}
          <FormGroup>
            <Label for="eventName">Event Name</Label>
            <Input
              required="required"
              type="text"
              id="eventName"
              onChange={(e) => setEventName(e.target.value)}
            />
          </FormGroup>
          <Row>
            <Col sm={6}>
              <FormGroup>
                <Label for="allowedPeople">Total Participants Allowed</Label>
                <Input
                  placeholder="Include yourself when counting!"
                  required="required"
                  type="number"
                  id="allowedPeople"
                  value={allowedPeople}
                  min={2}
                  onChange={(e) =>
                    setAllowedPeople(e.target.value > 2 ? e.target.value : 2)
                  }
                ></Input>
              </FormGroup>
            </Col>
            <Col sm={6}>
              <FormGroup>
                <Label for="eventType">Event Type</Label>
                <Input
                  required="required"
                  type="select"
                  id="eventType"
                  onChange={(e) => setEventType(e.target.value)}
                >
                  {eventTypeData.map(({ value, display }) => (
                    <option key={value} value={value}>
                      {display}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col sm={6}>
              <FormGroup>
                <Label for="publicEvent">Public Event?</Label>
                <Input
                  required="required"
                  type="select"
                  id="publicEvent"
                  onChange={(e) =>
                    setIsPublic(e.target.value === "true" ? true : false)
                  }
                >
                  <option value={true}>yes</option>
                  <option value={false}>no</option>
                </Input>
              </FormGroup>
            </Col>
            <Col sm={6}>
              <FormGroup>
                <Label for="location">Event Location</Label>
                <Input
                  required="required"
                  type="select"
                  id="location"
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {gymData.map(({ value, display }) => (
                    <option key={value} value={value}>
                      {display}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col sm={6}>
              <FormGroup>
                <Label for="startingDate">Starting Date</Label>
                <Input
                  required="required"
                  type="date"
                  id="startingDate"
                  value={eventStartingDate}
                  min={calculateDate()}
                  onChange={(e) => setEventStartingDate(e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col sm={6}>
              <FormGroup>
                <Label for="startingTime">Starting Time</Label>
                <Input
                  required="required"
                  type="time"
                  id="startingTime"
                  value={eventStartingTime}
                  onChange={(e) => setEventStartingTime(e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button block color="primary" type="submit">
                Submit
              </Button>
            </Col>
            <Col>
              <Button block color="danger" outline tag={Link} to="/launch">
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
};

export default AddEvent;
