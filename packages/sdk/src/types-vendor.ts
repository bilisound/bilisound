export type Section = {
  season_id: number;
  id: number;
  title: string;
  type: number;
  episodes: {
    season_id: number;
    section_id: number;
    id: number;
    aid: number;
    cid: number;
    title: string;
    attribute: number;
    arc: {
      aid: number;
      videos: number;
      type_id: number;
      type_name: string;
      copyright: number;
      pic: string;
      title: string;
      pubdate: number;
      ctime: number;
      desc: string;
      state: number;
      duration: number;
      rights: {
        bp: number;
        elec: number;
        download: number;
        movie: number;
        pay: number;
        hd5: number;
        no_reprint: number;
        autoplay: number;
        ugc_pay: number;
        is_cooperation: number;
        ugc_pay_preview: number;
        arc_pay: number;
        free_watch: number;
      };
      author: {
        mid: number;
        name: string;
        face: string;
      };
      stat: {
        aid: number;
        view: number;
        danmaku: number;
        reply: number;
        fav: number;
        coin: number;
        share: number;
        now_rank: number;
        his_rank: number;
        like: number;
        dislike: number;
        evaluation: string;
        argue_msg: string;
        vt: number;
        vv: number;
      };
      dynamic: string;
      dimension: {
        width: number;
        height: number;
        rotate: number;
      };
      desc_v2: any;
      is_chargeable_season: boolean;
      is_blooper: boolean;
      enable_vt: number;
      vt_display: string;
    };
    page: {
      cid: number;
      page: number;
      from: string;
      part: string;
      duration: number;
      vid: string;
      weblink: string;
      dimension: {
        width: number;
        height: number;
        rotate: number;
      };
    };
    bvid: string;
    pages: {
      cid: number;
      page: number;
      from: string;
      part: string;
      duration: number;
      vid: string;
      weblink: string;
      dimension: {
        width: number;
        height: number;
        rotate: number;
      };
    }[];
  }[];
  isActive: boolean;
  height: number;
};

export type SectionsInfo = {
  id: number;
  title: string;
  cover: string;
  mid: number;
  intro: string;
  sign_state: number;
  attribute: number;
  sections: Section[];
  stat: {
    season_id: number;
    view: number;
    danmaku: number;
    reply: number;
    fav: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    vt: number;
    vv: number;
  };
  ep_count: number;
  season_type: number;
  is_pay_season: boolean;
  enable_vt: number;
};

export type InitialStateResponse = {
  isPrVideo: boolean;
  aid: number;
  bvid: string;
  p: number;
  episode: string;
  videoData: {
    bvid: string;
    aid: number;
    videos: number;
    tid: number;
    tname: string;
    copyright: number;
    pic: string;
    title: string;
    pubdate: number;
    ctime: number;
    desc: string;
    desc_v2: {
      raw_text: string;
      type: number;
      biz_id: number;
    }[];
    state: number;
    duration: number;
    mission_id: number;
    rights: {
      bp: number;
      elec: number;
      download: number;
      movie: number;
      pay: number;
      hd5: number;
      no_reprint: number;
      autoplay: number;
      ugc_pay: number;
      is_cooperation: number;
      ugc_pay_preview: number;
      no_background: number;
      clean_mode: number;
      is_stein_gate: number;
      is_360: number;
      no_share: number;
      arc_pay: number;
      free_watch: number;
    };
    owner: {
      mid: number;
      name: string;
      face: string;
    };
    stat: {
      aid: number;
      view: number;
      danmaku: number;
      reply: number;
      favorite: number;
      coin: number;
      share: number;
      now_rank: number;
      his_rank: number;
      like: number;
      dislike: number;
      evaluation: string;
      vt: number;
      viewseo: number;
    };
    argue_info: {
      argue_msg: string;
      argue_type: number;
      argue_link: string;
    };
    dynamic: string;
    cid: number;
    dimension: {
      width: number;
      height: number;
      rotate: number;
    };
    season_id: number;
    premiere: any;
    teenage_mode: number;
    is_chargeable_season: boolean;
    is_story: boolean;
    is_upower_exclusive: boolean;
    is_upower_play: boolean;
    is_upower_preview: boolean;
    enable_vt: number;
    vt_display: string;
    no_cache: boolean;
    pages: {
      cid: number;
      page: number;
      from: string;
      part: string;
      duration: number;
      vid: string;
      weblink: string;
      dimension: {
        width: number;
        height: number;
        rotate: number;
      };
    }[];
    subtitle: {
      allow_submit: boolean;
      list: any[];
    };
    staff: {
      mid: number;
      title: string;
      name: string;
      face: string;
      vip: {
        type: number;
        status: number;
        due_date: number;
        vip_pay_type: number;
        theme_type: number;
        label: {
          path: string;
          text: string;
          label_theme: string;
          text_color: string;
          bg_style: number;
          bg_color: string;
          border_color: string;
          use_img_label: boolean;
          img_label_uri_hans: string;
          img_label_uri_hant: string;
          img_label_uri_hans_static: string;
          img_label_uri_hant_static: string;
        };
        avatar_subscript: number;
        nickname_color: string;
        role: number;
        avatar_subscript_url: string;
        tv_vip_status: number;
        tv_vip_pay_type: number;
        tv_due_date: number;
        avatar_icon: {
          icon_type: number;
          icon_resource: {
            type: number;
            url: string;
          };
        };
      };
      official: {
        role: number;
        title: string;
        desc: string;
        type: number;
      };
      follower: number;
      label_style: number;
    }[];
    ugc_season?: Partial<SectionsInfo>;
    is_season_display: boolean;
    user_garb: {
      url_image_ani_cut: string;
    };
    honor_reply: object;
    like_icon: string;
    need_jump_bv: boolean;
    disable_show_up_info: boolean;
    is_story_play: number;
    is_view_self: boolean;
    embedPlayer: {
      p: number;
      aid: number;
      bvid: string;
      cid: number;
      vid: string;
      vtype: string;
      stats: {
        spmId: string;
        spmIdFrom: string;
      };
      t: number;
      fromDid: any;
      featureList: object;
    };
  };
  upData: {
    mid: string;
    name: string;
    approve: boolean;
    sex: string;
    rank: string;
    face: string;
    face_nft: number;
    face_nft_type: number;
    DisplayRank: string;
    regtime: number;
    spacesta: number;
    birthday: string;
    place: string;
    description: string;
    article: number;
    attentions: any[];
    fans: number;
    friend: number;
    attention: number;
    sign: string;
    level_info: {
      current_level: number;
      current_min: number;
      current_exp: number;
      next_exp: number;
    };
    pendant: {
      pid: number;
      name: string;
      image: string;
      expire: number;
      image_enhance: string;
      image_enhance_frame: string;
      n_pid: number;
    };
    nameplate: {
      nid: number;
      name: string;
      image: string;
      image_small: string;
      level: string;
      condition: string;
    };
    Official: {
      role: number;
      title: string;
      desc: string;
      type: number;
    };
    official_verify: {
      type: number;
      desc: string;
    };
    vip: {
      type: number;
      status: number;
      due_date: number;
      vip_pay_type: number;
      theme_type: number;
      label: {
        path: string;
        text: string;
        label_theme: string;
        text_color: string;
        bg_style: number;
        bg_color: string;
        border_color: string;
        use_img_label: boolean;
        img_label_uri_hans: string;
        img_label_uri_hant: string;
        img_label_uri_hans_static: string;
        img_label_uri_hant_static: string;
      };
      avatar_subscript: number;
      nickname_color: string;
      role: number;
      avatar_subscript_url: string;
      tv_vip_status: number;
      tv_vip_pay_type: number;
      tv_due_date: number;
      avatar_icon: {
        icon_type: number;
        icon_resource: {
          type: number;
          url: string;
        };
      };
      vipType: number;
      vipStatus: number;
    };
    is_senior_member: number;
    name_render: any;
    archiveCount: number;
  };
  isCollection: number;
  sectionsInfo?: SectionsInfo;
  playedSectionId: any[];
  sections: Section[];
  staffData: {
    mid: number;
    title: string;
    name: string;
    face: string;
    vip: {
      type: number;
      status: number;
      due_date: number;
      vip_pay_type: number;
      theme_type: number;
      label: {
        path: string;
        text: string;
        label_theme: string;
        text_color: string;
        bg_style: number;
        bg_color: string;
        border_color: string;
        use_img_label: boolean;
        img_label_uri_hans: string;
        img_label_uri_hant: string;
        img_label_uri_hans_static: string;
        img_label_uri_hant_static: string;
      };
      avatar_subscript: number;
      nickname_color: string;
      role: number;
      avatar_subscript_url: string;
      tv_vip_status: number;
      tv_vip_pay_type: number;
      tv_due_date: number;
      avatar_icon: {
        icon_type: number;
        icon_resource: {
          type: number;
          url: string;
        };
      };
    };
    official: {
      role: number;
      title: string;
      desc: string;
      type: number;
    };
    follower: number;
    label_style: number;
  }[];
  tags: {
    tag_id: number;
    tag_name: string;
    music_id: string;
    tag_type: string;
    jump_url: string;
    showDetail: boolean;
    showReport: boolean;
    timeOut: any;
  }[];
  related: {
    aid: number;
    cid: number;
    bvid: string;
    duration: number;
    pic: string;
    title: string;
    owner: {
      name: string;
      mid: number;
    };
    stat: {
      danmaku: number;
      view: number;
      vt: number;
    };
    season_id: number;
    season_type: number;
    redirect_url: string;
    enable_vt: number;
    aiParameters: {
      goto: string;
      trackid: string;
      uniq_id: string;
      r_id: number;
    };
  }[];
  spec: any;
  isClient: boolean;
  error: object;
  player: any;
  playurl: object;
  user: object;
  cidMap: {
    "288071517": {
      aid: number;
      bvid: string;
      cids: {
        "1": number;
      };
    };
    BV1Wf4y1i7xZ: {
      aid: number;
      bvid: string;
      cids: {
        "1": number;
      };
    };
  };
  isRecAutoPlay: boolean;
  continuousPlay: boolean;
  autoPlayNextVideo: any;
  elecFullInfo: {
    show_info: {
      show: boolean;
      state: number;
      title: string;
      jump_url: string;
      icon: string;
      high_level: {
        privilege_type: number;
        title: string;
        sub_title: string;
        show_button: boolean;
        button_text: string;
        jump_url: {
          up_link: string;
          paywall_link: string;
          previewbar_link: string;
        };
        intro: string;
        open: boolean;
        new: boolean;
      };
    };
    av_count: number;
    count: number;
    total_count: number;
    special_day: number;
    display_num: number;
    cnt_priv_type: number;
    list: {
      mid: number;
      pay_mid: number;
      rank: number;
      uname: string;
      avatar: string;
      message: string;
      msg_deleted: number;
      vip_info: {
        vipType: number;
        vipDueMsec: number;
        vipStatus: number;
      };
      trend_type: number;
    }[];
  };
  adData: any;
  adsControl: any;
  bofqiParams: any;
  isBack: boolean;
  seasonType: number;
  premiereInfo: any;
  oldFanContract: object;
  hasShowedOldFan: boolean;
  noRecommendLive: boolean;
  noRecommendActivity: boolean;
  noTagAndNote: boolean;
  emergencyBan: {
    no_like: boolean;
    no_coin: boolean;
    no_fav: boolean;
    no_share: boolean;
  };
  isModern: boolean;
  playerReloadOrigin: string;
  queryTags: any[];
  pageTheme: string;
  nanoTheme: {
    "bpx-primary-color": string;
    "bpx-fn-color": string;
    "bpx-fn-hover-color": string;
    "bpx-box-shadow": string;
    "bpx-dmsend-switch-icon": string;
    "bpx-dmsend-hint-icon": string;
    "bpx-aux-header-icon": string;
    "bpx-aux-float-icon": string;
    "bpx-aux-block-icon": string;
    "bpx-dmsend-info-font": string;
    "bpx-dmsend-input-font": string;
    "bpx-dmsend-hint-font": string;
    "bpx-aux-header-font": string;
    "bpx-aux-footer-font": string;
    "bpx-aux-footer-font-hover": string;
    "bpx-aux-content-font1": string;
    "bpx-aux-content-font2": string;
    "bpx-aux-content-font3": string;
    "bpx-aux-content-font4": string;
    "bpx-aux-content-font5": string;
    "bpx-dmsend-main-bg": string;
    "bpx-dmsend-input-bg": string;
    "bpx-aux-header-bg": string;
    "bpx-aux-footer-bg": string;
    "bpx-aux-content-bg": string;
    "bpx-aux-button-bg": string;
    "bpx-aux-button-disabled-bg": string;
    "bpx-aux-float-bg": string;
    "bpx-aux-float-hover-bg": string;
    "bpx-aux-cover-bg": string;
    "bpx-dmsend-border": string;
    "bpx-aux-float-border": string;
    "bpx-aux-line-border": string;
    "bpx-aux-input-border": string;
    "bpx-dmsend-disable-button-bg": string;
    "bpx-dmsend-disable-button-text": string;
  };
  enable_vt: number;
  defaultWbiKey: {
    wbiImgKey: string;
    wbiSubKey: string;
  };
  bmpDefDomain: string;
  loadingRcmdTabData: boolean;
  rcmdTabData: {
    tab_name: string;
    archives: any[];
    has_more: boolean;
  };
  rcmdTabNames: string[];
  currentRcmdTab: {
    tab_name: string;
    tab_order: number;
    tab_type: number;
  };
  urlRuleKv: {
    whitelist: {
      domain: string[];
      rex: any[];
    };
    blacklist: {
      domain: any[];
      rex: any[];
    };
  };
  channelKv: {
    name: string;
    channelId: number;
    tid: number;
    url: string;
    icon: string;
    route?: string;
    sub?: {
      subChannelId: number;
      name: string;
      route?: string;
      desc?: string;
      url: string;
      tid?: number;
      hiddenInPrimaryChannel?: boolean;
      hiddenHotList?: boolean;
    }[];
    type?: string;
  }[];
  insertScripts: string[];
  constants: object;
  abtest: {
    login_dialog_version: string;
    call_pc_app: string;
    for_ai_home_version: string;
    ai_summary_version: string;
    bmg_fallback_version: string;
    rcmd_tab_version: string;
    danmuku_block_version: string;
    multip_section_version: string;
    comment_version_hash: string;
  };
  corePlayer: {
    id: number;
    ref: string;
    str: string;
  };
};

export type InitialStateFestivalResponse = {
  disableShowUpInfo: boolean;
  title: string;
  activityKey: string;
  toBvid: string;
  showBackToTop: boolean;
  reloadVideoInfo: {
    aid: any;
    cid: any;
    bvid: any;
    episodeId: any;
    origin: string;
  };
  pageStatus: number;
  userInfo: object;
  liveLineCount: number;
  isVideoWide: boolean;
  isVideo: boolean;
  isLive: boolean;
  liveInfo: any;
  hasThemeConfig: boolean;
  themeConfig: {
    arrow_btn_img: string;
    base_color: string;
    base_color_1: string;
    base_font_color: string;
    center_logo_img: string;
    combo_coin_img: string;
    combo_fav_img: string;
    combo_like_img: string;
    decorations_2233_img: string;
    default_element_color: string;
    default_element_color_1: string;
    default_element_color_2: string;
    default_element_color_3: string;
    hover_element_color: string;
    hover_element_color_1: string;
    info_font_color: string;
    info_font_color_1: string;
    info_font_color_2: string;
    like_animation_img: string;
    live_list_location_img: string;
    live_list_location_img_active: string;
    loading_bg_color: string;
    main_banner_bg_img: string;
    main_banner_title_img: string;
    mask_bg_color: string;
    operated_bg_color: string;
    page_bg_color: string;
    page_bg_img: string;
    player_loading_img: string;
    selected_element_color: string;
    share_icon_bg_img: string;
    share_img: string;
  };
  videoStaffs: {
    mid: number;
    title: string;
    name: string;
    face: string;
    vip: {
      type: number;
      status: number;
      vip_pay_type: number;
      theme_type: number;
    };
    official: {
      role: number;
      title: string;
      desc: string;
    };
    follower: number;
    label_style: number;
    relation: any;
    attention: boolean;
  }[];
  videoSections: {
    id: number;
    title: string;
    type: number;
    episodes: {
      id: number;
      aid: number;
      bvid: string;
      cid: number;
      title: string;
      cover: string;
      author: {
        mid: number;
        name: string;
        face: string;
      };
      rights: {
        bp: number;
        elec: number;
        download: number;
        movie: number;
        pay: number;
        hd5: number;
        no_reprint: number;
        autoplay: number;
        ugc_pay: number;
        is_cooperation: number;
        ugc_pay_preview: number;
        arc_pay: number;
        free_watch: number;
      };
      disable_show_up_info: boolean;
    }[];
    isActive: boolean;
    height: number;
  }[];
  sectionEpisodes: {
    id: number;
    aid: number;
    bvid: string;
    cid: number;
    title: string;
    cover: string;
    author: {
      mid: number;
      name: string;
      face: string;
    };
    rights: {
      bp: number;
      elec: number;
      download: number;
      movie: number;
      pay: number;
      hd5: number;
      no_reprint: number;
      autoplay: number;
      ugc_pay: number;
      is_cooperation: number;
      ugc_pay_preview: number;
      arc_pay: number;
      free_watch: number;
    };
    disable_show_up_info: boolean;
    episodeId: number;
  }[];
  videoPage: any[];
  gameIframeUrls: any[];
  disclaimer: {
    text: string;
    url: string;
  };
  bottomRelate: {
    url: string;
    cover: string;
  }[];
  activitySubscribe: {
    status: boolean;
    title: string;
    season_stat_view: number;
    season_stat_vt: number;
    enable_vt: number;
    season_stat_danmaku: number;
    button_title: string;
    button_selected_title: string;
    order_type: number;
    Param: {
      FavParam: {
        season_id: number;
      };
    };
    spmid: string;
  };
  videoStatus: {
    coin: number;
    fav: number;
    like: number;
    share: number;
  };
  videoInfo: {
    aid: number;
    cid: number;
    title: string;
    bvid: string;
    desc: string;
    noReprint: number;
    copyright: number;
    upMid: number;
    upName: string;
    pages: {
      cid: number;
      page: number;
      from: string;
      part: string;
      duration: number;
      vid: string;
      weblink: string;
      dimension: {
        width: number;
        height: number;
        rotate: number;
      };
    }[];
    viewCount: number;
    enableVt: boolean;
    vt: number;
    vtDisplay: string;
    danmakuCount: number;
    pubdate: number;
    his_rank: number;
  };
  player: string;
  userAction: {
    like: boolean;
    multiply: number;
    favorite: boolean;
    coin: boolean;
  };
  recommendList: {
    title: string;
    relate_item: any[];
    relate_video: {
      arc: {
        aid: number;
        videos: number;
        type_id: number;
        type_name: string;
        copyright: number;
        pic: string;
        title: string;
        pubdate: number;
        ctime: number;
        desc: string;
        state: number;
        duration: number;
        mission_id?: number;
        rights: {
          bp: number;
          elec: number;
          download: number;
          movie: number;
          pay: number;
          hd5: number;
          no_reprint: number;
          autoplay: number;
          ugc_pay: number;
          is_cooperation: number;
          ugc_pay_preview: number;
          arc_pay: number;
          free_watch: number;
        };
        author: {
          mid: number;
          name: string;
          face: string;
        };
        stat: {
          aid: number;
          view: number;
          danmaku: number;
          reply: number;
          fav: number;
          coin: number;
          share: number;
          now_rank: number;
          his_rank: number;
          like: number;
          dislike: number;
          evaluation: string;
          argue_msg: string;
          vt: number;
          vv: number;
        };
        dynamic: string;
        first_cid: number;
        dimension: {
          width: number;
          height: number;
          rotate: number;
        };
        desc_v2: any;
        is_chargeable_season: boolean;
        is_blooper: boolean;
        enable_vt: number;
        vt_display: string;
        season_id?: number;
      };
      bvid: string;
      season_type: number;
      aid: number;
      cid: number;
      title: string;
      pic: string;
      duration: number;
      owner: {
        mid: number;
        name: string;
        face: string;
      };
      view: number;
      danmaku: number;
      season_id?: number;
    }[];
  };
  liveTimeLine: any[];
  isGrpcData: boolean;
  isForbidNote: boolean;
  Q1080pParams: {
    subtitle: string;
    appId: number;
    appSubId: string;
    quality: string;
  };
  activityPageList: any;
  activityEnterAnime: {
    loading_img: string;
    anime_video: string;
    max_times: number;
  };
  enableEnterAnime: boolean;
  isEnterAnimeVisible: boolean;
  enterAnimeCnt: number;
};

export type WebPlayInfo = {
  code: number;
  message: string;
  ttl: number;
  data: {
    from: string;
    result: string;
    message: string;
    quality: number;
    format: string;
    timelength: number;
    accept_format: string;
    accept_description: string[];
    accept_quality: number[];
    video_codecid: number;
    seek_param: string;
    seek_type: string;
    dash?: {
      duration: number;
      minBufferTime: number;
      min_buffer_time: number;
      video: {
        id: number;
        baseUrl: string;
        base_url: string;
        backupUrl: string[];
        backup_url: string[];
        bandwidth: number;
        mimeType: string;
        mime_type: string;
        codecs: string;
        width: number;
        height: number;
        frameRate: string;
        frame_rate: string;
        sar: string;
        startWithSap: number;
        start_with_sap: number;
        SegmentBase: {
          Initialization: string;
          indexRange: string;
        };
        segment_base: {
          initialization: string;
          index_range: string;
        };
        codecid: number;
      }[];
      audio: {
        id: number;
        baseUrl: string;
        base_url: string;
        backupUrl: string[];
        backup_url: string[];
        bandwidth: number;
        mimeType: string;
        mime_type: string;
        codecs: string;
        width: number;
        height: number;
        frameRate: string;
        frame_rate: string;
        sar: string;
        startWithSap: number;
        start_with_sap: number;
        SegmentBase: {
          Initialization: string;
          indexRange: string;
        };
        segment_base: {
          initialization: string;
          index_range: string;
        };
        codecid: number;
      }[];
      dolby: {
        type: number;
        audio: any;
      };
      flac: any;
    };
    durl?: {
      order: number;
      length: number;
      size: number;
      ahead: string;
      vhead: string;
      url: string;
      backup_url: string[];
    }[];
    support_formats: {
      quality: number;
      format: string;
      new_description: string;
      display_desc: string;
      superscript: string;
      codecs: string[];
    }[];
    high_format: any;
    volume: {
      measured_i: number;
      measured_lra: number;
      measured_tp: number;
      measured_threshold: number;
      target_offset: number;
      target_i: number;
      target_tp: number;
    };
    last_play_time: number;
    last_play_cid: number;
  };
  session: string;
};

export type UserSeasonInfo = {
  code: number;
  message: string;
  ttl: number;
  data: {
    aids: number[];
    archives: {
      aid: number;
      bvid: string;
      ctime: number;
      duration: number;
      enable_vt: boolean;
      interactive_video: boolean;
      pic: string;
      playback_position: number;
      pubdate: number;
      stat: {
        view: number;
        vt: number;
      };
      state: number;
      title: string;
      ugc_pay: number;
      vt_display: string;
    }[];
    meta: {
      category: number;
      cover: string;
      description: string;
      mid: number;
      name: string;
      ptime: number;
      season_id: number;
      total: number;
    };
    page: {
      page_num: number;
      page_size: number;
      total: number;
    };
  };
};

export type UserSeriesInfo = {
  code: number;
  message: string;
  ttl: number;
  data: {
    aids: number[];
    page: {
      num: number;
      size: number;
      total: number;
    };
    archives: {
      aid: number;
      title: string;
      pubdate: number;
      ctime: number;
      state: number;
      pic: string;
      duration: number;
      stat: {
        view: number;
      };
      bvid: string;
      ugc_pay: number;
      interactive_video: boolean;
      enable_vt: number;
      vt_display: string;
      playback_position: number;
    }[];
  };
};

export type UserSeriesMetadata = {
  code: number;
  message: string;
  ttl: number;
  data: {
    meta: {
      series_id: number;
      mid: number;
      name: string;
      description: string;
      keywords: string[];
      creator: string;
      state: number;
      last_update_ts: number;
      total: number;
      ctime: number;
      mtime: number;
      raw_keywords: string;
      category: number;
    };
    recent_aids: number[];
  };
};
