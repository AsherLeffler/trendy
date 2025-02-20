import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/Home.css";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Clapperboard,
  CupSoda,
  Dumbbell,
  FlaskConical,
  Headset,
  HeartPulse,
  Icon,
  MessageCircle,
  Music,
  Plane,
  Shirt,
  Flag,
  Star,
} from "lucide-react";
import { football } from "@lucide/lab";
import { Trend } from "../types";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
  testing,
  currentTopTrends,
  currentHasSetUpAccount,
} from "../Constants";
import TopTrend from "../components/TopTrend";

export default function Home() {
  const { isAuthenticated, isLoading, loginWithRedirect, user, logout } =
    useAuth0();

  const [topTrends, setTopTrends] = useState<Trend[] | null>(
    currentTopTrends.value
  );
  const [hotTrendsLoading, setHotTrendsLoading] = useState(false);
  const [hasSetUpAccount, setHasSetUpAccount] = useState<boolean | null>(
    currentHasSetUpAccount.value
  );
  const [savedTrends, setSavedTrends] = useState<string[] | null>(null);

  const nicknameInputRef = useRef<HTMLInputElement | null>(null);
  const updateTrendsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const birthDateInputRef = useRef<HTMLInputElement | null>(null);

  const fetchUserProperty = async (property: string) => {
    if (user) {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/users/getUserProperty",
          {
            params: {
              userId: user.sub,
              property: property,
            },
          }
        );
        if (property === "hasSetUpAccount") {
          setHasSetUpAccount(res.data);
          currentHasSetUpAccount.value = res.data;
        }
      } catch (error) {
        console.error("Error fetching first login status:", error);
      }
    }
  };

  const updateTopTrends = async () => {
    // Prevent a new update if one is already in progress
    if (hotTrendsLoading || !user) return;

    setHotTrendsLoading(true);

    try {
      const trendsRes = await axios.post(
        "http://localhost:8080/api/reddit/topReddit",
        6,
        {
          headers: {
            "Content-Type": "text/plain",
          },
          withCredentials: true, // Send cookies
        }
      );

      const savedTrendsRes = await axios.get(
        "http://localhost:8080/api/users/getSavedTrends",
        {
          params: {
            userId: user.sub,
          },
        }
      );

      setSavedTrends(savedTrendsRes.data);

      setHotTrendsLoading(false);
      currentTopTrends.value = trendsRes.data;
      setTopTrends(trendsRes.data);
    } catch (error) {
      console.error("Error updating top trends:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !testing) {
      // Perform an immediate update on component mount
      if (currentTopTrends.value == null) updateTopTrends();

      // Set up the interval if it's not already set
      if (updateTrendsIntervalRef.current === null) {
        updateTrendsIntervalRef.current = setInterval(() => {
          updateTopTrends();
        }, 180000); // 180,000ms = 3 minutes
      }

      // Clean up the interval on component unmount
      return () => {
        if (updateTrendsIntervalRef.current !== null) {
          clearInterval(updateTrendsIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, hasSetUpAccount]);

  useEffect(() => {
    if (currentHasSetUpAccount.value == null)
      fetchUserProperty("hasSetUpAccount");
  }, [user]);

  useEffect(() => {
    console.log(user);
  }, [isAuthenticated]);

  const updateInformation = async () => {
    const nickname: string | null = nicknameInputRef.current?.value || null;
    const gender: string | null =
      (
        document.querySelector(
          'input[name="genderInput"]:checked'
        ) as HTMLInputElement
      )?.value || null;
    const birthDate: string | null = birthDateInputRef.current?.value || null;

    const jsonRequest = JSON.stringify({
      nickname: nickname,
      app_metadata: {
        hasSetUpAccount: true,
      },
      user_metadata: {
        gender: gender,
        birthDate: birthDate,
      },
    });

    if ((nickname || gender) && user) {
      try {
        await axios.patch(
          "http://localhost:8080/api/users/updateUserInformation",
          {
            userId: user.sub,
            toUpdate: jsonRequest,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setHasSetUpAccount(true);
      } catch (error) {
        console.error("Error updating user information:", error);
      }
    }
  };

  const getLoadingTrendElements = () => {
    const elements = [];
    for (let i = 0; i < 6; i++) {
      elements.push(
        <div key={"topTrend" + i} style={{ cursor: "default" }}>
          <div className="top-trend">
            <Star
              size={30}
              color="grey"
              style={{ animationDelay: `${0.1 * i}s` }}
              className="textLoading"
            />
            <div className="vertical-divider"></div>
            <h2
              style={{ animationDelay: `${0.1 * i}s` }}
              className="top-trend-name textLoading"
            >
              Loading...
            </h2>
          </div>
          {i < 5 && <div className="trend-divider"></div>}
        </div>
      );
    }
    return elements;
  };

  if (hasSetUpAccount == false) {
    return (
      <div className="userSetup">
        <h1>Welcome to the User Setup!</h1>
        <p>Please complete your profile to get started.</p>
        <input
          ref={nicknameInputRef}
          type="text"
          placeholder="Enter your nickname"
        />
        <br />
        <h3>Gender:</h3>
        <div>
          <label htmlFor="genderMale">Male</label>
          <input type="radio" name="genderInput" value="male" id="genderMale" />
          <label htmlFor="genderFemale">Female</label>
          <input
            type="radio"
            name="genderInput"
            value="female"
            id="genderFemale"
          />
          <label htmlFor="genderOther">Other</label>
          <input
            type="radio"
            name="genderInput"
            value="other"
            id="genderOther"
          />
        </div>
        <br />
        <h3>Birth Date:</h3>
        <input type="date" ref={birthDateInputRef} />
        <br />
        <button onClick={updateInformation}>Update Information</button>
        <br />
        <button onClick={() => logout()}>Log Out</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bodyCont">
        <div className="content bottom">
          <div className="header-wrapper">
            <div className="header-cont loading"></div>
          </div>
          <div className="body-wrapper">
            <div className="left-body-cont loading"></div>
            <div className="right-body-cont loading"></div>
          </div>
          <div className="body-wrapper">
            <div className="right-body-cont loading"></div>
            <div className="left-body-cont loading"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && hasSetUpAccount) {
    return (
      <>
        <div className="bodyCont">
          <Header />
          <div className="content bottom">
            <div className="header-wrapper">
              <div className="header-cont">
                <div className="text">
                  <h1 className="section-title header">
                    Evaluate the trends of the world with a simple click, using
                    AI
                  </h1>
                  <p className="section-text header">
                    Explore current and upcoming trends to find all sorts of
                    statistics like relevancy, start date, and more.
                  </p>
                  <Link to="/ask-ai">
                    <button id="try-it-button">Try It Now</button>
                  </Link>
                </div>
                {/* <div className="geometric-bg"></div> */}
              </div>
            </div>
            <div className="body-wrapper">
              <div className="left-body-cont">
                <Link to="/categories">
                  <h1 className="section-title">Categories</h1>
                </Link>
                <div className="categories-wrapper">
                  <Link to="/category/fashion">
                    <button className="categoryButton fashion">
                      <Shirt size={42} />
                    </button>
                  </Link>
                  <Link to="/category/technology">
                    <button className="categoryButton technology">
                      <Headset size={42} />
                    </button>
                  </Link>
                  <Link to="/category/foodandbeverages">
                    <button className="categoryButton food">
                      <CupSoda size={42} />
                    </button>
                  </Link>
                  <Link to="/category/entertainment">
                    <button className="categoryButton entertainment">
                      <Clapperboard size={42} />
                    </button>
                  </Link>
                  <Link to="/category/socialmedia">
                    <button className="categoryButton social">
                      <MessageCircle size={42} />
                    </button>
                  </Link>
                  <Link to="/category/fitness">
                    <button className="categoryButton fitness">
                      <Dumbbell size={42} />
                    </button>
                  </Link>
                  <Link to="/category/wellness">
                    <button className="categoryButton wellness">
                      <HeartPulse size={42} />
                    </button>
                  </Link>
                  <Link to="/category/music">
                    <button className="categoryButton music">
                      <Music size={42} />
                    </button>
                  </Link>
                  <Link to="/category/politics">
                    <button className="categoryButton politics">
                      <Flag size={42} />
                    </button>
                  </Link>
                  <Link to="/category/travel">
                    <button className="categoryButton travel">
                      <Plane size={42} />
                    </button>
                  </Link>
                  <Link to="/category/science">
                    <button className="categoryButton science">
                      <FlaskConical size={42} />
                    </button>
                  </Link>
                  <Link to="/category/sports">
                    <button className="categoryButton sports">
                      <Icon iconNode={football} size={42} />
                    </button>
                  </Link>
                </div>
              </div>
              <div className="right-body-cont">
                <Link to="/hottrends" style={{ textDecoration: "none" }}>
                  <h1 className="section-title">Hot 🔥🔥🔥</h1>
                </Link>
                <div className="top-trends-wrapper">
                  {topTrends &&
                    topTrends.map((trend: Trend, index: number) => (
                      <TopTrend
                        key={index}
                        trend={trend}
                        index={index}
                        savedTrends={savedTrends}
                        total={topTrends.length}
                      />
                    ))}
                  {topTrends === null && getLoadingTrendElements()}
                </div>
              </div>
            </div>
            <div className="body-wrapper">
              <div className="right-body-cont">
                <h1 className="section-title">TBD</h1>
              </div>
              <div className="left-body-cont">
                <Link to="/favorites">
                  <h1 className="section-title">Favorites</h1>
                </Link>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="bodyCont">
        <div className="bg-container">
          {/* <img className="homeBackground" src={bg} alt="geometric shapes" /> */}
        </div>
        <Header />
        <div className="content">
          <div className="title">
            <h1 id="titleText">Sign up and discover the latest trends today</h1>
            <a onClick={() => loginWithRedirect()}>Sign Up</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return <div className="bodyCont">Loading...</div>;
}
