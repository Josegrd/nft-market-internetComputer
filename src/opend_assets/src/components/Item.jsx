import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { Principal } from "@dfinity/principal";

function Item(props) {
  const id = props.id;
  const localHost = "http://localhost:8000";
  const agent = new HttpAgent({ host: localHost });
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState(null)
  const [image, setImage] = useState("");

  async function loadNFT() {
    const NFTActor = await Actor.createActor(idlFactory,{
      agent,
      canisterId: id
    });
    const name = await NFTActor.getName();
    setName(name);
    const principal = await NFTActor.getOwner();
    setPrincipal(principal.toText());
    const imageData = await NFTActor.getImage();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent], { type: "image/png" }));
    setImage(image);
  }

  useEffect(() => {
    loadNFT();
  }, []);

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
        />
        <div className="disCardContent-root">
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"></span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
              Owner: {principal}
            </p>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Item;
