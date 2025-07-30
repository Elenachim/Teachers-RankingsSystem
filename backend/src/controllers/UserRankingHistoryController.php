<?php
include_once "../models/UserRankingHistoryModel.php";

class UserRankingHistoryController
{
    private $model;

    public function __construct($db)
    {
        $this->model = new UserRankingHistoryModel($db);
    }

    public function getHistory($userID)
    {
        $history = $this->model->getUserRankingHistory($userID);
        echo json_encode($history);
    }
}
