import React, { useState, useEffect, useContext } from "react";
import EventCard from "./EventCard";
import { UserContext } from "../../contexts/UserContext";
import { firestore, auth } from "firebase";
import { Redirect } from "react-router-dom";
import { Layout } from "react-mdl";
import Navbar from "../Navbar/Navbar";

const EventPage = () => {
  const { userData, userLoading } = useContext(UserContext);

  const [userEventList, setUserEventList] = useState();

  useEffect(() => {
    if (userData) {
      const { uid } = auth().currentUser;
      const unsubscribeUserEventList = firestore()
        .collection("user_profile")
        .doc(uid)
        .collection("events")
        .onSnapshot(snap => {
          let tmp = [];
          snap.forEach(doc => tmp.push(doc.data()));
          setUserEventList(tmp);
        });
      return () => {
        unsubscribeUserEventList();
      };
    }
  }, [userData]);

  if (userLoading || !userEventList) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  } else if (!userData) {
    return <Redirect to="/launch" />;
  } else {
    return (
      <div>
        <Navbar />
        <div className="main-container">
          <Layout>
            <header>
              <h1>My Events</h1>
            </header>
            {userEventList && userEventList.length > 0 && (
              <ul>
                {userEventList.map(event => (
                  <EventCard key={event.eid} eid={event.eid} />
                ))}
              </ul>
            )}
          </Layout>
        </div>
      </div>
    );
  }
};

export default EventPage;